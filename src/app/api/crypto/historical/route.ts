import prisma from '@/lib/prisma'
import { createCachedResponse, createErrorResponse } from '@/lib/utils/cache'

export const revalidate = 3600 // 1 hora

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const days = parseInt(searchParams.get('days') || '7')

    if (!symbol) {
      return createErrorResponse('Symbol parameter is required', 400)
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const historicalData = await prisma.marketData.findMany({
      where: {
        symbol: symbol.toUpperCase(),
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

    return createCachedResponse(historicalData, {
      revalidate: 3600,
      staleWhileRevalidate: 59,
      tags: ['crypto', 'historical', `symbol-${symbol.toLowerCase()}`]
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return createErrorResponse(error)
  }
} 