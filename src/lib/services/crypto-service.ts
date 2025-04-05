import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'
import { CryptoData } from '@/types/crypto'

const UPDATE_INTERVAL = 55 * 60 * 1000 // 55 minutos (para que coincida con la revalidación de la página)

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
    const needsUpdate = !lastUpdateTime || 
      (now.getTime() - lastUpdateTime.getTime()) > UPDATE_INTERVAL

    if (needsUpdate) {
      try {
        // 2. Fetch new data from API
        console.log('Fetching new crypto data from API...')
        const data = await cryptoAPI.getTopCryptos()
        
        // 3. Save to database
        const result = await prisma.marketData.createMany({
          data: data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            price: coin.price,
            volume: coin.volume.toString(),
            market_cap: coin.market_cap,
            change: coin.change,
            type: 'CRYPTO',
            timestamp: new Date()
          }))
        })

        // Note: We're removing revalidatePath as it causes dynamic server usage errors
        // The page will be revalidated based on the revalidate setting in page.tsx

        console.log('Crypto data updated:', result.count, 'records')
        return { updated: true, count: result.count }
      } catch (error) {
        console.error('Error fetching/saving crypto data:', error)
        // If update fails, return existing data
        return { updated: false, error: 'API or database error' }
      }
    }

    return { updated: false, reason: 'Data is up to date' }
  } catch (error) {
    console.error('Error checking crypto data:', error)
    return { updated: false, error: 'Database check error' }
  }
}

export async function getLatestCryptoData(): Promise<CryptoData[]> {
  try {
    // Get latest data for each symbol
    const latestData = await prisma.$queryRaw<CryptoData[]>`
      WITH LatestTimestamps AS (
        SELECT symbol, MAX(timestamp) as latest_timestamp
        FROM "MarketData"
        WHERE type = 'CRYPTO'
        GROUP BY symbol
      )
      SELECT m.*
      FROM "MarketData" m
      INNER JOIN LatestTimestamps lt 
        ON m.symbol = lt.symbol 
        AND m.timestamp = lt.latest_timestamp
      WHERE m.type = 'CRYPTO'
      ORDER BY m.market_cap DESC
    `

    return latestData
  } catch (error) {
    console.error('Error fetching latest crypto data:', error)
    // Return empty array if query fails
    return []
  }
}