import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiRequest, validateSymbol, validateTimeRange } from '@/lib/utils/security'

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

export async function GET(request: NextRequest) {
  // Validar la solicitud
  if (!validateApiRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized request' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const days = parseInt(searchParams.get('days') || '7')

  // Validar parámetros
  if (!validateSymbol(symbol)) {
    return NextResponse.json(
      { error: 'Invalid symbol' },
      { status: 400 }
    )
  }

  if (!validateTimeRange(days)) {
    return NextResponse.json(
      { error: 'Invalid time range' },
      { status: 400 }
    )
  }

  try {
    // En este punto symbol ya está validado y no puede ser null
    const validSymbol = symbol as string

    // Obtener datos históricos de los últimos N días
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const historicalData = await prisma.marketData.findMany({
      where: {
        symbol: validSymbol.toUpperCase(),
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        price: true,
        timestamp: true
      }
    })

    if (!historicalData.length) {
      return NextResponse.json([])
    }

    // Transformar los datos al formato requerido por el gráfico
    const formattedData = historicalData.map(record => ({
      date: record.timestamp,
      value: record.price
    }))

    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}
