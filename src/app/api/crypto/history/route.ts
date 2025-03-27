import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const days = parseInt(searchParams.get('days') || '7')

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    // Obtener datos históricos de los últimos N días
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const historicalData = await prisma.marketData.findMany({
      where: {
        symbol: symbol,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Transformar los datos al formato requerido por el gráfico
    const formattedData = historicalData.map(record => ({
      date: record.timestamp,
      value: record.price
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}
