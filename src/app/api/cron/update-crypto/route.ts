import { NextResponse } from 'next/server'
import { cryptoAPI } from '@/lib/api/crypto-service'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function updateCryptoData() {
  console.log('Iniciando actualización de datos...')
  
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
  return results
}

export async function GET(request: Request) {
  try {
    // Verificar si es una petición de Vercel Cron
    const headersList = headers()
    const userAgent = headersList.get('user-agent')
    
    if (userAgent !== 'vercel-cron/1.0') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await updateCryptoData()
    return NextResponse.json({ 
      success: true,
      count: results.length 
    })
  } catch (error) {
    console.error('Error en actualización automática:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Validate authorization header
    const headersList = headers()
    const authHeader = headersList.get('Authorization')
    
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await updateCryptoData()
    return NextResponse.json({ 
      success: true,
      count: results.length 
    })
  } catch (error) {
    console.error('Error en actualización manual:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}