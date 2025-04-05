import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const metadata = await prisma.cryptoMarketMetadata.findMany({
      orderBy: { symbol: 'asc' }
    })

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching crypto metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto metadata' },
      { status: 500 }
    )
  }
} 