import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const lastRecord = await prisma.marketData.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    // Si el último registro es más antiguo de 3 horas, permitir actualización
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const needsUpdate = !lastRecord || lastRecord.timestamp < threeHoursAgo
    
    return NextResponse.json({ 
      lastUpdate: lastRecord?.timestamp || null,
      needsUpdate
    })
  } catch (error) {
    console.error('Error getting last update time:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
