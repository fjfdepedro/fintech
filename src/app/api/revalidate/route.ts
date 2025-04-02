import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    const headersList = headers()
    const authHeader = headersList.get('Authorization')

    // Verificar el secret en el header de autorización
    if (!authHeader || `Bearer ${process.env.CRON_SECRET}` !== authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Revalidar la ruta especificada
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
} 