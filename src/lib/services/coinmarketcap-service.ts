import prisma from '@/lib/prisma'
import { coinmarketcapAPI, symbolMap } from '@/lib/api/coinmarketcap-service'
import { specificCoins } from '@/lib/api/crypto-service'
import { revalidatePath } from 'next/cache'

// Actualizar cada 12 horas para respetar los límites de la API gratuita
const UPDATE_INTERVAL = 12 * 60 * 60 * 1000 // 12 horas
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 segundos

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processWithRetry(coinId: string, globalMetrics: any, retryCount = 0): Promise<any> {
  try {
    console.log(`Fetching metadata for ${coinId} (attempt ${retryCount + 1})...`)
    const metadata = await coinmarketcapAPI.getCryptoMetadata(coinId)
    if (!metadata) {
      throw new Error(`Failed to get metadata for ${coinId}`)
    }

    const symbol = symbolMap[coinId] || coinId.toUpperCase()
    console.log(`Got metadata for ${symbol}, updating database...`)
    
    // Actualizar o crear el registro de metadatos
    const updated = await prisma.cryptoMarketMetadata.upsert({
      where: { symbol },
      create: {
        id: symbol.toLowerCase(),
        symbol,
        logo_url: metadata.logo,
        description: metadata.description,
        category: metadata.category,
        website_url: metadata.urls.website[0] || null,
        tech_doc_url: metadata.urls.technical_doc[0] || null,
        source_code_url: metadata.urls.source_code[0] || null,
        total_market_cap: globalMetrics.total_market_cap,
        total_volume_24h: globalMetrics.total_volume_24h,
        btc_dominance: globalMetrics.btc_dominance,
        eth_dominance: globalMetrics.eth_dominance,
        active_cryptos: globalMetrics.total_cryptocurrencies,
        active_exchanges: globalMetrics.total_exchanges,
        timestamp: new Date(),
        updated_at: new Date()
      },
      update: {
        logo_url: metadata.logo,
        description: metadata.description,
        category: metadata.category,
        website_url: metadata.urls.website[0] || null,
        tech_doc_url: metadata.urls.technical_doc[0] || null,
        source_code_url: metadata.urls.source_code[0] || null,
        total_market_cap: globalMetrics.total_market_cap,
        total_volume_24h: globalMetrics.total_volume_24h,
        btc_dominance: globalMetrics.btc_dominance,
        eth_dominance: globalMetrics.eth_dominance,
        active_cryptos: globalMetrics.total_cryptocurrencies,
        active_exchanges: globalMetrics.total_exchanges,
        updated_at: new Date()
      }
    })
    
    console.log(`Updated metadata for ${symbol}`)
    return updated
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Error processing ${coinId}, retrying in ${RETRY_DELAY/1000} seconds...`)
      await delay(RETRY_DELAY)
      return processWithRetry(coinId, globalMetrics, retryCount + 1)
    }
    console.error(`Failed to process ${coinId} after ${MAX_RETRIES} attempts:`, error)
    return null
  }
}

interface CoinMarketCapMetadata {
  symbol: string
  logo: string
}

export async function checkAndUpdateCoinMarketCapData() {
  try {
    // 1. Check last update time
    const lastUpdate = await prisma.cryptoMarketMetadata.findFirst({
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
        // 2. Fetch new metadata from API
        console.log('Fetching new crypto metadata from CoinMarketCap...')
        const metadata = await coinmarketcapAPI.getMetadata()
        
        // 3. Save to database
        const result = await prisma.cryptoMarketMetadata.createMany({
          data: metadata.map((coin: CoinMarketCapMetadata) => ({
            symbol: coin.symbol,
            logo_url: coin.logo,
            timestamp: new Date()
          }))
        })

        console.log('Crypto metadata updated:', result.count, 'records')
        return { updated: true, count: result.count }
      } catch (error) {
        console.error('Error fetching/saving crypto metadata:', error)
        return { updated: false, error: 'API or database error' }
      }
    }

    return { updated: false, reason: 'Metadata is up to date' }
  } catch (error) {
    console.error('Error checking crypto metadata:', error)
    return { updated: false, error: 'Database check error' }
  }
}

export async function getLatestCryptoMetadata() {
  try {
    const metadata = await prisma.cryptoMarketMetadata.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      distinct: ['symbol'],
      select: {
        symbol: true,
        logo_url: true
      }
    })

    return metadata
  } catch (error) {
    console.error('Error fetching crypto metadata:', error)
    return []
  }
}

export async function getCryptoMarketMetadata(symbol: string) {
  try {
    return await prisma.cryptoMarketMetadata.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })
  } catch (error) {
    console.error(`Error fetching metadata for ${symbol}:`, error)
    return null
  }
}

export async function getLatestMarketMetrics() {
  try {
    return await prisma.cryptoMarketMetadata.findFirst({
      orderBy: { timestamp: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching market metrics:', error)
    return null
  }
} 