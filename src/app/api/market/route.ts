import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { MarketData, ApiLimit } from '@/types/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const symbol = searchParams.get('symbol')

  if (!type || !symbol) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const data = await prisma.marketData.findFirst({
      where: { 
        symbol,
        type
      },
      orderBy: { timestamp: 'desc' }
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const data = await request.json()
  
  try {
    const result = await prisma.marketData.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        volume: data.volume,
        type: data.type
      }
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
