import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Forzar que no se cachee
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const lastRecord = await prisma.marketData.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const needsUpdate = !lastRecord || lastRecord.timestamp < oneHourAgo
    
    return NextResponse.json({ 
      lastUpdate: lastRecord?.timestamp,
      needsUpdate
    })
  } catch (error) {
    console.error('Error verificando última actualización:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
