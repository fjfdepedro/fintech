import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'
import { cache } from 'react'

const DATA_REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes
const NEGATIVE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours - Cryptocurrency symbols rarely change, and if a coin is delisted, it's unlikely to return within 24 hours
const VERCEL_CACHE_TTL = 60 * 5 // 5 minutes

// Cache for negative results
const negativeCache = new Map<string, { timestamp: number, message: string }>()

interface MarketDataResponse {
  id?: string
  symbol?: string
  name?: string | null
  price?: number
  change?: number
  volume?: string
  market_cap?: number
  timestamp?: Date
  logo_url?: string | null
  error?: string
}

export const getBasicCryptoData = cache(async (symbol: string): Promise<MarketDataResponse> => {
  try {
    // Check negative cache first
    const cachedNegative = negativeCache.get(symbol.toUpperCase())
    if (cachedNegative && Date.now() - cachedNegative.timestamp < NEGATIVE_CACHE_TTL) {
      console.log(`Using cached negative result for ${symbol}`)
      return { error: cachedNegative.message }
    }

    const marketData = await prisma.marketData.findFirst({
      where: {
        symbol: symbol.toUpperCase()
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (!marketData) {
      const errorMessage = `No data available for ${symbol.toUpperCase()}. This cryptocurrency may not be supported or may have been delisted.`
      negativeCache.set(symbol.toUpperCase(), {
        timestamp: Date.now(),
        message: errorMessage
      })
      return { error: errorMessage }
    }

    // Ensure all required fields are present
    const response: MarketDataResponse = {
      id: marketData.id,
      symbol: marketData.symbol,
      name: marketData.name,
      price: marketData.price,
      change: marketData.change,
      volume: marketData.volume,
      market_cap: marketData.market_cap,
      timestamp: marketData.timestamp,
      logo_url: marketData.logo_url
    }

    return response
  } catch (error: any) {
    console.error('Error fetching basic crypto data:', error)
    
    // Cache HTTP 500 and 400 errors
    if (error?.statusCode === 500 || error?.statusCode === 400 || error?.code === 'P2002' || error?.code === 'P2025') {
      const errorMessage = 'Service temporarily unavailable. Please try again later.'
      negativeCache.set(symbol.toUpperCase(), {
        timestamp: Date.now(),
        message: errorMessage
      })
      console.log(`Cached error for ${symbol} due to HTTP ${error?.statusCode || error?.code}`)
      return { error: errorMessage }
    }

    return { 
      error: 'An error occurred while fetching cryptocurrency data. Please try again later.' 
    }
  }
})

export async function getDetailedCryptoData(symbol: string) {
  try {
    // First, try to get recent data from database
    const cryptoDetails = await prisma.cryptoDetails.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        timestamp: {
          gte: new Date(Date.now() - DATA_REFRESH_INTERVAL)
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // If we have recent data in DB, return it
    if (cryptoDetails?.data) {
      return cryptoDetails.data
    }

    // If not, fetch fresh data from APIs
    const [cryptoDetailAPI, onChainDataAPI, exchangesAPI] = await Promise.allSettled([
      cryptoAPI.getCryptoDetail(symbol.toLowerCase()),
      cryptoAPI.getOnChainData(symbol.toLowerCase()),
      cryptoAPI.getExchangesList(symbol.toLowerCase())
    ])

    const detailedData = {
      detail: cryptoDetailAPI.status === 'fulfilled' ? cryptoDetailAPI.value : null,
      onChain: onChainDataAPI.status === 'fulfilled' ? onChainDataAPI.value : null,
      exchanges: exchangesAPI.status === 'fulfilled' ? exchangesAPI.value : null
    }

    // Store all data in a single record
    await prisma.cryptoDetails.create({
      data: {
        symbol: symbol.toUpperCase(),
        data: detailedData,
        timestamp: new Date()
      }
    })

    return detailedData
  } catch (error) {
    console.error('Error fetching detailed crypto data:', error)
    return null
  }
}

// Function to prefetch data in background
export function prefetchCryptoData(symbol: string) {
  if (typeof window === 'undefined') return

  // Use requestIdleCallback for better performance
  const prefetch = () => {
    getDetailedCryptoData(symbol).catch(console.error)
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch)
  } else {
    setTimeout(prefetch, 1)
  }
} 