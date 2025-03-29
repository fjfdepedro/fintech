import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25')

    const cryptoData = await prisma.marketData.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json(cryptoData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto data', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}

export async function POST(request: Request) {
  const data = await request.json()
  
  try {
    // Obtener el inicio y fin de la hora actual
    const now = new Date()
    const startOfHour = new Date(now.setMinutes(0, 0, 0))
    const endOfHour = new Date(now.setTime(now.getTime() + 60 * 60 * 1000 - 1))

    // Verificar si ya existe un registro para esta criptomoneda en esta hora
    const existingRecord = await prisma.marketData.findFirst({
      where: {
        symbol: data.symbol,
        timestamp: {
          gte: startOfHour,
          lte: endOfHour
        }
      }
    })

    if (existingRecord) {
      return NextResponse.json({ 
        message: 'Ya existe un registro para esta criptomoneda en esta hora',
        existingRecord 
      })
    }

    // Si no existe, crear nuevo registro
    const result = await prisma.marketData.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        volume: data.volume,
        type: data.type,
        timestamp: new Date(),
        market_cap: data.market_cap
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en la base de datos:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
} 