import { NextResponse } from 'next/server'
import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    console.log('Iniciando actualización manual de datos...')
    
    // 1. Obtener datos de CoinGecko
    const apiData = await cryptoAPI.getTopCryptos(25)
    console.log('Datos de CoinGecko recibidos:', apiData.length, 'registros')
    
    // 2. Guardar en base de datos
    const results = await Promise.all(apiData.map(data => 
      prisma.marketData.create({
        data: {
          symbol: data.symbol.toUpperCase(),
          name: data.name || data.symbol,
          price: Number(data.price),
          change: Number(data.change),
          volume: String(data.volume || '0'),
          market_cap: Number(data.market_cap || 0),
          type: 'CRYPTO',
          timestamp: new Date()
        }
      })
    ))

    console.log('Actualización completada:', results.length, 'registros guardados')
    return NextResponse.json({ 
      success: true,
      count: results.length 
    })
  } catch (error) {
    console.error('Error en actualización manual:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}