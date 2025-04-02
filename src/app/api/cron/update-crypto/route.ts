import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { checkAndUpdateCryptoData } from '@/lib/services/crypto-service'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify if it's a Vercel Cron request
    const headersList = headers()
    const userAgent = headersList.get('user-agent')
    
    if (userAgent !== 'vercel-cron/1.0') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndUpdateCryptoData()
    
    if (result.updated) {
      revalidatePath('/')
    }

    return NextResponse.json({ 
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error in automatic crypto update:', error)
    return NextResponse.json({ error: 'Crypto update failed' }, { status: 500 })
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

    const result = await checkAndUpdateCryptoData()
    
    if (result.updated) {
      revalidatePath('/')
    }

    return NextResponse.json({ 
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error in manual crypto update:', error)
    return NextResponse.json({ error: 'Crypto update failed' }, { status: 500 })
  }
}