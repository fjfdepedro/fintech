import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'
import { newsAPI } from '@/lib/api/news-service'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    console.log('Fetching dashboard data...')
    
    // Fetch crypto data
    const cryptoData = await prisma.marketData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 25,
    })
    console.log(`Found ${cryptoData.length} crypto records`)

    // Fetch news
    const news = await newsAPI.getCryptoNews()
    console.log(`Found ${news.length} news items`)

    // Get historical data for charts
    const historicalData = await Promise.all(
      (cryptoData.length > 0 ? cryptoData.slice(0, 10) : []).map(async (crypto) => {
        try {
          console.log(`Fetching historical data for ${crypto.symbol}...`)
          const data = await cryptoAPI.getHistoricalData(crypto.symbol)
          return {
            coinId: crypto.id,
            symbol: crypto.symbol,
            data: data.map((d: any) => ({
              date: new Date(d[0]),
              value: d[1]
            }))
          }
        } catch (error) {
          console.error(`Error fetching historical data for ${crypto.symbol}:`, error)
          return {
            coinId: crypto.id,
            symbol: crypto.symbol,
            data: []
          }
        }
      })
    )

    const response = {
      cryptoData: cryptoData || [],
      news: news || [],
      historicalData: historicalData || [],
      lastUpdated: new Date().toISOString()
    }

    console.log('Dashboard data fetched successfully')
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 