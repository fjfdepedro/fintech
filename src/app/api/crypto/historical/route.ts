import prisma from '@/lib/prisma'
import { createCachedResponse, createErrorResponse } from '@/lib/utils/cache'
import { NextRequest } from 'next/server'

export const revalidate = 3600 // 1 hora

export async function GET(request: NextRequest) {
  try {
    // Use NextRequest instead of Request to avoid dynamic server usage
    const symbol = request.nextUrl.searchParams.get('symbol')
    const days = parseInt(request.nextUrl.searchParams.get('days') || '7')

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
    // Convert unknown error to string or Error object
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unknown error occurred'

    return createErrorResponse(errorMessage)
  }
}
