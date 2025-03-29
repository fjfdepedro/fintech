import axios from 'axios'
import type { MarketData } from '.prisma/client'
import axiosRetry from 'axios-retry'
import { PrismaClient } from '@prisma/client'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const prisma = new PrismaClient()

axiosRetry(axios, {
  retries: 3, // Número de reintentos
  retryDelay: (retryCount) => retryCount * 1000, // Intervalo entre reintentos
  retryCondition: (error) => error.response?.status === 429, // Reintentar solo en error 429
})

export const cryptoAPI = {
  async getTopCryptos(limit: number = 25): Promise<MarketData[]> {
    try {
      // Lista específica de criptomonedas que queremos seguir
      const specificCoins = [
        // Criptomonedas originales
        'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
        'tether', 'cardano', 'dogecoin', 'sui', 'arbitrum',
        'algorand', 'floki', 'toncoin',
        'polkadot', 'polygon', 'avalanche-2', 'chainlink', 'uniswap',
        'stellar', 'cosmos', 'optimism', 'near', 'aptos',
        'injective-protocol', 'sei-network'
      ]

      const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: specificCoins.join(','),
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
        },
      })

      return response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_percentage_24h,
        volume: coin.total_volume.toString(),
        market_cap: coin.market_cap,
        type: 'CRYPTO',
        timestamp: new Date(),
      }))
    } catch (error) {
      console.error('Error fetching crypto data:', error)
      throw error
    }
  },

  async getMarketChart(coinId: string, days: number = 7) {
    try {
      const response = await axios.get(
        `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
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
      const response = await axios.get(`${COINGECKO_API_URL}/search/trending`)
      return response.data.coins
    } catch (error) {
      console.error('Error fetching trending coins:', error)
      throw error
    }
  },

  async getGlobalData() {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/global`)
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

    return historicalData.map(data => [
      data.timestamp.getTime(),
      data.price
    ])
  }
}

cryptoAPI.getTopCryptos(25)
  .then(data => data)
  .catch(error => console.error('Error:', error))
