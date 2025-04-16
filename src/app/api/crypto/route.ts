import { getLatestCryptoData } from '@/lib/services/crypto-service'
import { createCachedResponse, createErrorResponse } from '@/lib/utils/cache'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from '@/lib/utils/revalidate'
import { CryptoDataSchema, validateApiResponse, createApiError } from '@/lib/utils/api-validation'
import { z } from 'zod'
import { CryptoData } from '@/types/crypto'

export const dynamic = 'force-static'
export const revalidate = 3600

// Schema for validation
const cryptoDataSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  price: z.number(),
  volume: z.string(),
  market_cap: z.number(),
  change: z.number(),
  timestamp: z.date()
}))

export async function GET() {
  try {
    const data = await getLatestCryptoData()
    
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    })
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch data' }),
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Si no hay body, asumimos que es una revalidación
    if (!body || Object.keys(body).length === 0) {
      revalidateTag('crypto')
      return createCachedResponse({ 
        message: 'Revalidation triggered successfully',
        timestamp: new Date().toISOString()
      }, {
        revalidate: 0,
        staleWhileRevalidate: 0,
        isDynamic: false
      })
    }

    // Validar el body
    const validation = validateApiResponse(body, CryptoDataSchema)
    if (!validation.success) {
      return createErrorResponse(validation.error.message)
    }

    const now = new Date()
    const startOfHour = new Date(now.setMinutes(0, 0, 0))
    const endOfHour = new Date(now.setTime(now.getTime() + 60 * 60 * 1000 - 1))

    const existingRecord = await prisma.marketData.findFirst({
      where: {
        symbol: validation.data.symbol,
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

    const result = await prisma.marketData.create({
      data: {
        symbol: validation.data.symbol,
        name: validation.data.name,
        price: validation.data.price,
        change: validation.data.change,
        volume: validation.data.volume.toString(),
        timestamp: new Date(),
        market_cap: validation.data.market_cap ?? 0
      }
    })

    await Promise.all([
      revalidatePath('/'),
      revalidatePath('/api/crypto'),
      revalidatePath('/api/crypto/history')
    ])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(
      createApiError(
        'DATABASE_ERROR',
        'Failed to process request',
        error instanceof Error ? error.message : undefined
      ).message
    )
  }
} 