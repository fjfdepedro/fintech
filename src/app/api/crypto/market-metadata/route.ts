import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkAndUpdateCoinMarketCapData } from '@/lib/services/coinmarketcap-service'

// Forzar que no se cachee
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Verificar si necesitamos actualizar los datos
    const lastUpdate = await prisma.cryptoMarketMetadata.findFirst({
      orderBy: { timestamp: 'desc' }
    })

    const now = new Date()
    // Actualizar cada 12 horas para respetar los límites de la API gratuita
    const needsUpdate = !lastUpdate?.timestamp || 
      (now.getTime() - lastUpdate.timestamp.getTime()) > 12 * 60 * 60 * 1000 // 12 horas

    // Si necesitamos actualizar, lo hacemos en segundo plano
    if (needsUpdate) {
      // Actualizamos en segundo plano para no bloquear la respuesta
      checkAndUpdateCoinMarketCapData().catch(error => {
        console.error('Error updating market metadata:', error)
      })
    }

    // Siempre devolvemos los datos más recientes de la base de datos
    const metadata = await prisma.cryptoMarketMetadata.findFirst({
      orderBy: { timestamp: 'desc' }
    })

    if (!metadata) {
      return NextResponse.json(
        { error: 'No se encontraron datos de mercado' },
        { status: 404 }
      )
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching market metadata:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de mercado' },
      { status: 500 }
    )
  }
} 