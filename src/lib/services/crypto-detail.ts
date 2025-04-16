import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'

const DATA_REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

export async function getBasicCryptoData(symbol: string) {
  try {
    const marketData = await prisma.marketData.findFirst({
      where: {
        symbol: symbol.toUpperCase()
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    return marketData
  } catch (error) {
    console.error('Error fetching basic crypto data:', error)
    return null
  }
}

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