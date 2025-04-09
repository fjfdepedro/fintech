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
export const specificCoins = [
  // Top Tier
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'tether',
  'usd-coin', 'cardano', 'dogecoin', 'polkadot', 'solana',
  'avalanche-2', 'chainlink', 'uniswap', 'stellar', 'cosmos',
  'near', 'aptos', 'sui', 'the-open-network', 'tron',
  'wrapped-bitcoin', 'wrapped-steth', 'leo-token', 'lido-staked-ether',
  'shiba-inu',
  // Mid Tier
  'polygon', 'monero', 'bitcoin-cash', 'litecoin', 'dai',
  'ethereum-classic', 'hedera-hashgraph', 'filecoin', 'internet-computer',
  'arbitrum', 'optimism', 'cronos', 'algorand', 'vechain',
  'aave', 'eos', 'tezos', 'quant-network', 'elrond-erd-2',
  'pax-gold', 'theta-token', 'fantom', 'thorchain', 'pancakeswap-token',
  'curve-dao-token',
  // Nuevas Adiciones
  'render', // RNDR
  'sei-network', // SEI
  'floki', // FLOKI
  'dogwifhat', // WIF
  'hyperliquid', // HYPE
  'ondo', // ONDO
  'berachain', // BERA - Podría no estar disponible aún en CMC
  'story-protocol', // IP - Podría no estar disponible aún en CMC
  'solaxy', // SOLX - Podría no estar disponible aún en CMC
  'qubetics', // TICS - Podría no estar disponible aún en CMC
  // Criptomonedas mediáticas y populares
  'trump', // $TRUMP - Trump Coin
  'melania', // $MELANIA - Melania Coin
  'dawgz', // $DAGZ - Dawgz AI
  'book-of-meme', // BOME - Book of Meme
  'slothana', // SLOTH - Slothana
  'shytoshi-kusama', // $SHY - Shytoshi Kusama
  'venom' // VENOM - Venom
]

const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 1000

// Helper function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  async getTopCryptos(): Promise<MarketData[]> {
    try {
      console.log('Iniciando obtención de datos de CoinGecko...')
      
      // First, get all existing data from the database
      const existingData = await prisma.marketData.findMany({
        where: {
          type: 'CRYPTO',
          symbol: {
            in: specificCoins.map(coin => coin.toUpperCase())
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol']
      })

      // Calculate which coins need updating (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const coinsToUpdate = specificCoins.filter(coin => {
        const existingCoin = existingData.find(data => 
          data.symbol.toLowerCase() === coin.toUpperCase()
        )
        return !existingCoin || existingCoin.timestamp < oneHourAgo
      })

      console.log(`${coinsToUpdate.length} monedas necesitan actualización`)
      
      if (coinsToUpdate.length === 0) {
        console.log('Todos los datos están actualizados, usando caché')
        return existingData
      }

      // Dividir las monedas a actualizar en lotes más pequeños
      const coinBatches = chunkArray(coinsToUpdate, BATCH_SIZE)
      const updatedData: any[] = []
      
      // Procesar cada lote con un retraso entre ellos
      for (let i = 0; i < coinBatches.length; i++) {
        const batch = coinBatches[i]
        console.log(`Procesando lote ${i + 1}/${coinBatches.length} (${batch.length} monedas)`)
        
        try {
          const response = await fetch(
            `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${batch.join(',')}&order=market_cap_desc&per_page=${batch.length}&page=1&sparkline=false&price_change_percentage=24h&locale=en`,
            {
              headers: {
                'x-cg-demo-api-key': COINGECKO_API_KEY || '',
              },
            }
          )
          
          if (!response.ok) {
            if (response.status === 429) {
              console.log(`Rate limit alcanzado en lote ${i + 1}, usando datos en caché para este lote`)
              // Find and use cached data for this batch
              const cachedBatchData = existingData.filter(data => 
                batch.includes(data.symbol.toLowerCase())
              )
              updatedData.push(...cachedBatchData)
              continue
            }
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const batchData = await response.json()
          if (Array.isArray(batchData)) {
            updatedData.push(...batchData)
          }
          
          // Esperar antes de la siguiente petición
          if (i < coinBatches.length - 1) {
            console.log(`Esperando ${DELAY_BETWEEN_BATCHES}ms antes del siguiente lote...`)
            await delay(DELAY_BETWEEN_BATCHES)
          }
        } catch (error) {
          console.error(`Error en lote ${i + 1}:`, error)
          // Use cached data for this batch on error
          const cachedBatchData = existingData.filter(data => 
            batch.includes(data.symbol.toLowerCase())
          )
          updatedData.push(...cachedBatchData)
          continue
        }
      }
      
      const currentTimestamp = getCurrentUTCTimestamp()
      
      // Convert updated data to MarketData format
      const newData = updatedData.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change: coin.price_change_percentage_24h || 0,
        volume: (coin.total_volume || 0).toString(),
        market_cap: coin.market_cap || 0,
        type: 'CRYPTO',
        timestamp: currentTimestamp
      }))

      // Combine new data with existing data that didn't need updating
      const finalData = [
        ...newData,
        ...existingData.filter(data => 
          !coinsToUpdate.includes(data.symbol.toLowerCase())
        )
      ]

      console.log(`Completado: ${finalData.length} monedas en total (${newData.length} actualizadas, ${finalData.length - newData.length} en caché)`)
      
      return finalData

    } catch (error) {
      console.error('Error obteniendo datos de CoinGecko:', error)
      // Return all cached data as fallback
      const cachedData = await prisma.marketData.findMany({
        where: {
          type: 'CRYPTO'
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol'],
        take: specificCoins.length
      })
      
      if (cachedData.length > 0) {
        console.log('Usando datos en caché después de error:', cachedData.length, 'registros')
        return cachedData
      }
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
      return await processInChunks<string>(symbols, 5, async (symbol: string) => {
        const data = await cryptoAPI.getHistoricalData(symbol);
        return { symbol, data };
      });
    } catch (error) {
      console.error('Error in batch historical data fetch:', error);
      return [];
    }
  }
}
