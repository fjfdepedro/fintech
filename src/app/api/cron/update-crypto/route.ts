import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'

export const dynamic = 'force-dynamic'

async function updateCryptoData() {
  console.log('Starting crypto data update...')
  
  try {
    const data = await cryptoAPI.getMarketData()
    
    // Batch insert all records
    const result = await prisma.marketData.createMany({
      data: data.map(coin => ({
        name: coin.name,
        symbol: coin.symbol,
        price: coin.price,
        volume: coin.volume.toString(),
        market_cap: coin.market_cap,
        change: coin.price_change_24h,
        type: 'CRYPTO',
        timestamp: new Date()
      }))
    })

    console.log('Crypto data updated:', result.count, 'records')
    return result
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
      recordsUpdated: result.count
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
      recordsUpdated: result.count
    })
  } catch (error) {
    console.error('Error in manual crypto update:', error)
    return NextResponse.json({ error: 'Crypto update failed' }, { status: 500 })
  }
}