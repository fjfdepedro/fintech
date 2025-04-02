import { NextResponse } from 'next/server'
import { newsAPI } from '@/lib/api/news-service'
import { articleAPI } from '@/lib/api/article-service'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function updateArticleData() {
  console.log('Iniciando actualización de artículo...')
  
  // 1. Obtener datos de las criptomonedas para el artículo
  const cryptoData = await prisma.marketData.findMany({
    where: {
      type: 'CRYPTO'
    },
    orderBy: {
      timestamp: 'desc'
    },
    distinct: ['symbol']
  })

  // 2. Obtener noticias
  const newsArticles = await newsAPI.getCryptoNews()
  
  // 3. Generar el artículo usando articleAPI
  const content = await articleAPI.generateArticle(cryptoData, newsArticles)
  
  // 4. Guardar el artículo
  const result = await prisma.article.create({
    data: {
      content: content.html,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('Artículo actualizado:', result.id)
  return result
}

export async function GET(request: Request) {
  try {
    // Verificar si es una petición de Vercel Cron
    const headersList = headers()
    const userAgent = headersList.get('user-agent')
    
    if (userAgent !== 'vercel-cron/1.0') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await updateArticleData()
    return NextResponse.json({ 
      success: true,
      articleId: result.id
    })
  } catch (error) {
    console.error('Error en actualización automática de artículo:', error)
    return NextResponse.json({ error: 'Article update failed' }, { status: 500 })
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

    const result = await updateArticleData()
    return NextResponse.json({ 
      success: true,
      articleId: result.id
    })
  } catch (error) {
    console.error('Error en actualización manual de artículo:', error)
    return NextResponse.json({ error: 'Article update failed' }, { status: 500 })
  }
}
