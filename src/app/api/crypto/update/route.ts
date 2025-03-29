import { NextResponse } from 'next/server'
import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    // Verificar si necesitamos actualizar
    const lastRecord = await prisma.marketData.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    if (lastRecord && lastRecord.timestamp > oneHourAgo) {
      return NextResponse.json({ 
        message: 'Data is up to date',
        lastUpdate: lastRecord.timestamp
      })
    }

    // Obtener nuevos datos de CoinGecko
    const apiData = await cryptoAPI.getTopCryptos(25)
    
    // Guardar en la base de datos
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
      lastUpdate: new Date()
    })
  } catch (error) {
    console.error('Error updating crypto data:', error)
    return NextResponse.json(
      { error: 'Failed to update crypto data' },
      { status: 500 }
    )
  }
} 