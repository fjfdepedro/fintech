import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Forzar que no se cachee
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const cryptoData = await prisma.marketData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 25,
    })

    return NextResponse.json(cryptoData)
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
