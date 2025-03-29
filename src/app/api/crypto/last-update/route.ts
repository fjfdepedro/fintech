import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const lastRecord = await prisma.marketData.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    // Si el último registro es más antiguo de 1 hora, permitir actualización
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const needsUpdate = !lastRecord || lastRecord.timestamp < oneHourAgo
    
    return NextResponse.json({ 
      lastUpdate: lastRecord?.timestamp || null,
      needsUpdate
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error getting last update time:', error)
    return NextResponse.json({ error: 'Database error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  }
}
