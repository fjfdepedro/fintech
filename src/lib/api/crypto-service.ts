import axios from 'axios'
import type { MarketData } from '.prisma/client'
import axiosRetry from 'axios-retry'
import prisma from '../prisma'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

// Configurar headers por defecto para todas las llamadas a CoinGecko
const coingeckoAxios = axios.create({
  baseURL: COINGECKO_API_URL,
  headers: {
    'x-cg-demo-api-key': COINGECKO_API_KEY
  }
})

// Configurar retry para el cliente específico de CoinGecko
axiosRetry(coingeckoAxios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => error.response?.status === 429,
})

// Helper function to get current UTC timestamp
const getCurrentUTCTimestamp = () => {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ))
}

// Lista de criptomonedas específicas que queremos seguir
const specificCoins = [
  // Top 25 actuales
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'tether',
  'usd-coin', 'cardano', 'dogecoin', 'polkadot', 'solana',
  'avalanche-2', 'chainlink', 'uniswap', 'stellar', 'cosmos',
  'near', 'aptos', 'sui', 'the-open-network', 'tron',
  'wrapped-bitcoin', 'wrapped-steth', 'leo-token', 'lido-staked-ether',
  'shiba-inu',
  
  // Añadidas hasta 50
  'polygon', 'monero', 'bitcoin-cash', 'litecoin', 'dai',
  'ethereum-classic', 'hedera-hashgraph', 'filecoin', 'internet-computer',
  'arbitrum', 'optimism', 'cronos', 'algorand', 'vechain',
  'aave', 'eos', 'tezos', 'quant-network', 'elrond-erd-2',
  'pax-gold', 'theta-token', 'fantom', 'thorchain', 'pancakeswap-token',
  'curve-dao-token'
]

// Helper function to process data in chunks
const processInChunks = async <T>(
  items: T[],
  chunkSize: number,
  processItem: (item: T) => Promise<any>
): Promise<any[]> => {
  const results: any[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(item => processItem(item).catch(error => {
        console.error(`Error processing item:`, error);
        return null;
      }))
    );
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
};

export const cryptoAPI = {
  async getTopCryptos(limit: number = 50): Promise<MarketData[]> {
    try {
      console.log('Llamando a CoinGecko API...')
      
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${specificCoins.join(',')}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h&locale=en`,
        {
          headers: {
            'x-cg-demo-api-key': COINGECKO_API_KEY || '',
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Respuesta de CoinGecko recibida:', data.length, 'registros')
      
      const currentTimestamp = getCurrentUTCTimestamp();
      
      return data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_percentage_24h,
        volume: coin.total_volume.toString(),
        market_cap: coin.market_cap,
        type: 'CRYPTO',
        timestamp: currentTimestamp
      }))
    } catch (error) {
      console.error('Error obteniendo datos de CoinGecko:', error)
      throw error
    }
  },

  async getMarketChart(coinId: string, days: number = 7) {
    try {
      const response = await coingeckoAxios.get(
        `/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days
          }
        }
      )

      return response.data
    } catch (error) {
      console.error(`Error obteniendo el gráfico de mercado para ${coinId}:`, error)
      throw error
    }
  },

  async getTrendingCoins() {
    try {
      const response = await coingeckoAxios.get('/search/trending')
      return response.data.coins
    } catch (error) {
      console.error('Error fetching trending coins:', error)
      throw error
    }
  },

  async getGlobalData() {
    try {
      const response = await coingeckoAxios.get('/global')
      return response.data.data
    } catch (error) {
      console.error('Error fetching global data:', error)
      throw error
    }
  },

  async saveCryptoData(data: MarketData) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = await axios.post(`${baseUrl}/api/crypto`, data)

      return response.data
    } catch (error) {
      console.error('Error saving crypto data:', error)
      throw error
    }
  },

  async getLastUpdateTime(): Promise<Date | null> {
    try {
      const response = await axios.get('/api/crypto/last-update')
      return response.data.lastUpdate ? new Date(response.data.lastUpdate) : null
    } catch (error) {
      console.error('Error getting last update time:', error)
      return null
    }
  },

  getHistoricalData: async (symbol: string) => {
    try {
      const historicalData = await prisma.marketData.findMany({
        where: {
          symbol: symbol.toUpperCase()
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 7,
        select: {
          timestamp: true,
          price: true
        }
      })

      return historicalData.map(data => {
        // Convert timestamp to UTC for consistency
        const utcTimestamp = new Date(Date.UTC(
          data.timestamp.getUTCFullYear(),
          data.timestamp.getUTCMonth(),
          data.timestamp.getUTCDate(),
          data.timestamp.getUTCHours(),
          data.timestamp.getUTCMinutes(),
          data.timestamp.getUTCSeconds()
        ))
        
        return {
          date: utcTimestamp,
          value: data.price
        }
      })
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      return [] // Return empty array on error
    }
  },

  // Function to get historical data for multiple symbols
  getHistoricalDataBatch: async (symbols: string[]) => {
    try {
      // Process symbols in chunks of 5 to avoid overwhelming the database
      return await processInChunks(symbols, 5, async (symbol) => {
        const data = await cryptoAPI.getHistoricalData(symbol);
        return { symbol, data };
      });
    } catch (error) {
      console.error('Error in batch historical data fetch:', error);
      return [];
    }
  }
}
