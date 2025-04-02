import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function updateCryptoData() {
  console.log('Starting crypto data update check...')
  
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
      (now.getTime() - lastUpdateTime.getTime()) > 30 * 60 * 1000 // 30 minutes

    if (!needsUpdate) {
      console.log('Data is up to date, skipping update')
      return { count: 0, updated: false }
    }

    // 2. Fetch new data from API
    console.log('Fetching new data from API...')
    const data = await cryptoAPI.getTopCryptos(25)
    
    // 3. Batch insert new records
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

    // 4. Revalidate cache
    revalidatePath('/')

    console.log('Crypto data updated:', result.count, 'records')
    return { count: result.count, updated: true }
  } catch (error) {
    console.error('Error updating crypto data:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    // Verify if it's a Vercel Cron request
    const headersList = headers()
    const userAgent = headersList.get('user-agent')
    
    if (userAgent !== 'vercel-cron/1.0') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await updateCryptoData()
    return NextResponse.json({ 
      success: true,
      recordsUpdated: result.count,
      dataUpdated: result.updated
    })
  } catch (error) {
    console.error('Error in automatic crypto update:', error)
    return NextResponse.json({ error: 'Crypto update failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Validate authorization header
    const headersList = headers()
    const authHeader = headersList.get('Authorization')
    
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await updateCryptoData()
    return NextResponse.json({ 
      success: true,
      recordsUpdated: result.count,
      dataUpdated: result.updated
    })
  } catch (error) {
    console.error('Error in manual crypto update:', error)
    return NextResponse.json({ error: 'Crypto update failed' }, { status: 500 })
  }
}