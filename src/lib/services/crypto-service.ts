import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'
import { CryptoData } from '@/types/crypto'

const UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hora (para que coincida con la revalidación de la página)
const MAX_BACKOFF_INTERVAL = 4 * 60 * 60 * 1000 // 4 horas máximo de espera

// Variable para trackear los intentos fallidos
let failedAttempts = 0
let lastFailureTime = 0

export async function checkAndUpdateCryptoData() {
  try {
    // 1. Check last update time
    const lastUpdate = await prisma.marketData.findFirst({
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        timestamp: true
      }
    })

    const now = new Date()
    const lastUpdateTime = lastUpdate?.timestamp

    // Si hubo un fallo reciente, aplicar backoff exponencial
    if (failedAttempts > 0) {
      const backoffInterval = Math.min(
        UPDATE_INTERVAL * Math.pow(2, failedAttempts),
        MAX_BACKOFF_INTERVAL
      )
      const timeElapsedSinceFailure = now.getTime() - lastFailureTime
      
      if (timeElapsedSinceFailure < backoffInterval) {
        console.log(`Esperando backoff (${Math.round(backoffInterval/1000/60)} minutos), usando datos en caché`)
        return { updated: false, reason: 'En periodo de backoff', useCached: true }
      }
    }

    const needsUpdate = !lastUpdateTime || 
      (now.getTime() - lastUpdateTime.getTime()) > UPDATE_INTERVAL

    if (needsUpdate) {
      try {
        // 2. Fetch new data from API
        console.log('Fetching new crypto data from API...')
        const data = await cryptoAPI.getTopCryptos()
        
        if (!data || data.length === 0) {
          failedAttempts++
          lastFailureTime = now.getTime()
          console.log('API returned no data, using cached data (intento fallido #${failedAttempts})')
          return { updated: false, reason: 'API returned no data', useCached: true }
        }
        
        // Reset failed attempts on success
        failedAttempts = 0
        lastFailureTime = 0
        
        // 3. Save to database
        const result = await prisma.marketData.createMany({
          data: data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            price: coin.price,
            volume: coin.volume.toString(),
            market_cap: coin.market_cap,
            change: coin.change,
            timestamp: new Date()
          })) as any
        })

        // Note: We're removing revalidatePath as it causes dynamic server usage errors
        // The page will be revalidated based on the revalidate setting in page.tsx

        console.log('Crypto data updated:', result.count, 'records')
        return { updated: true, count: result.count }
      } catch (error) {
        failedAttempts++
        lastFailureTime = now.getTime()
        console.error(`Error fetching/saving crypto data (intento fallido #${failedAttempts}):`, error)
        // If update fails due to API limit or other error, return existing data
        return { 
          updated: false, 
          error: error instanceof Error ? error.message : 'API or database error', 
          useCached: true,
          backoffMinutes: Math.round(Math.min(UPDATE_INTERVAL * Math.pow(2, failedAttempts), MAX_BACKOFF_INTERVAL) / 1000 / 60)
        }
      }
    }

    return { updated: false, reason: 'Data is up to date', useCached: true }
  } catch (error) {
    console.error('Error checking crypto data:', error)
    return { updated: false, error: 'Database check error', useCached: true }
  }
}

export async function getLatestCryptoData(): Promise<CryptoData[]> {
  try {
    // Get latest data for each symbol
    const latestData = await prisma.$queryRaw<CryptoData[]>`
      WITH LatestTimestamps AS (
        SELECT symbol, MAX(timestamp) as latest_timestamp
        FROM "MarketData"
        GROUP BY symbol
      )
      SELECT m.*
      FROM "MarketData" m
      INNER JOIN LatestTimestamps lt 
        ON m.symbol = lt.symbol 
        AND m.timestamp = lt.latest_timestamp
      ORDER BY m.market_cap DESC
    `

    if (!latestData || latestData.length === 0) {
      console.warn('No crypto data found in database')
      // Try to get any data from the last 24 hours
      const fallbackData = await prisma.marketData.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol']
      })

      if (fallbackData && fallbackData.length > 0) {
        console.log('Using fallback data from last 24 hours:', fallbackData.length, 'records')
        return fallbackData
      }
    }

    return latestData
  } catch (error) {
    console.error('Error fetching latest crypto data:', error)
    // Try to get any recent data as a last resort
    try {
      const emergencyData = await prisma.marketData.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol'],
        take: 50
      })
      
      if (emergencyData && emergencyData.length > 0) {
        console.log('Using emergency fallback data:', emergencyData.length, 'records')
        return emergencyData
      }
    } catch (dbError) {
      console.error('Error getting emergency data:', dbError)
    }
    return []
  }
}