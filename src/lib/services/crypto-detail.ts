import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'
import { cache } from 'react'

const DATA_REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes
const NEGATIVE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours - Cryptocurrency symbols rarely change, and if a coin is delisted, it's unlikely to return within 24 hours
const VERCEL_CACHE_TTL = 60 * 5 // 5 minutes

// Cache for negative results
const negativeCache = new Map<string, { timestamp: number, message: string }>()

export const getBasicCryptoData = cache(async (symbol: string) => {
  try {
    // Check negative cache first
    const cachedNegative = negativeCache.get(symbol.toUpperCase())
    if (cachedNegative && Date.now() - cachedNegative.timestamp < NEGATIVE_CACHE_TTL) {
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
      // Cache negative result
      negativeCache.set(symbol.toUpperCase(), {
        timestamp: Date.now(),
        message: `No data available for ${symbol.toUpperCase()}. This cryptocurrency may not be supported or may have been delisted.`
      })
      return { error: `No data available for ${symbol.toUpperCase()}. This cryptocurrency may not be supported or may have been delisted.` }
    }

    return marketData
  } catch (error) {
    console.error('Error fetching basic crypto data:', error)
    return { error: 'An error occurred while fetching cryptocurrency data. Please try again later.' }
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