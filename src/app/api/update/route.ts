import { NextResponse } from 'next/server'
import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 1. Obtener nuevos datos de CoinGecko
    const apiData = await cryptoAPI.getTopCryptos(25)
    
    // 2. Guardar los nuevos datos
    await Promise.all(apiData.map(data => 
      prisma.marketData.create({
        data: {
          ...data,
          timestamp: new Date()
        }
      })
    ))

    return NextResponse.json({ 
      message: 'Data updated successfully',
      lastUpdate: new Date(),
      count: apiData.length
    })
  } catch (error) {
    console.error('Error updating crypto data:', error)
    return NextResponse.json(
      { error: 'Failed to update crypto data' },
      { status: 500 }
    )
  }
}
