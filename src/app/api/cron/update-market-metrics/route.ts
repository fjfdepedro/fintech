import { NextResponse } from 'next/server'
import { checkAndUpdateCoinMarketCapData } from '@/lib/services/coinmarketcap-service'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: Request) {
  try {
    // Verificar el token de autorización
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]

    if (!token || token !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Actualizar datos
    const result = await checkAndUpdateCoinMarketCapData()

    if (!result.updated && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in market metrics update cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 