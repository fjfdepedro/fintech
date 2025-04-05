import { NextResponse } from 'next/server'
import { checkAndUpdateCoinMarketCapData } from '@/lib/services/coinmarketcap-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const result = await checkAndUpdateCoinMarketCapData()
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error('Error updating metadata:', error)
    return NextResponse.json({ success: false, error: 'Failed to update metadata' }, { status: 500 })
  }
} 