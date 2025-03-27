import axios from 'axios'
import type { marketData } from '.prisma/client'
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
  async getTopCryptos(limit: number = 20): Promise<marketData[]> {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
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
      console.log(`Iniciando llamada a la API de CoinGecko para obtener el gráfico de mercado de ${coinId}...`)
      const response = await axios.get(
        `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days
          }
        }
      )
      console.log(`Datos del gráfico de mercado recibidos para ${coinId}:`, response.data)
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

  async saveCryptoData(data: marketData) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = await axios.post(`${baseUrl}/api/crypto`, data)
      console.log('Starting historical data fetch...')
      console.log(`Getting historical data for ${data.symbol}...`)
      console.log(`Data saved for ${data.symbol}`)
      console.log('Historical data fetch completed.')
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
  }
}

cryptoAPI.getTopCryptos(20)
  .then(data => console.log('Datos obtenidos:', data))
  .catch(error => console.error('Error:', error))
