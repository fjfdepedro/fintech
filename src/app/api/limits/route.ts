import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { MarketData, ApiLimit } from '@/types/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const apiName = searchParams.get('api')

  if (!apiName) {
    return NextResponse.json({ error: 'Missing API name' }, { status: 400 })
  }

  try {
    const limit = await prisma.apiLimit.findUnique({
      where: { apiName }
    })
    return NextResponse.json(limit)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const data = await request.json()

  try {
    const limit = await prisma.apiLimit.upsert({
      where: { apiName: data.apiName },
      create: data,
      update: { requestCount: { increment: 1 } }
    })
    return NextResponse.json(limit)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
