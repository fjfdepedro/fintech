export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { newsAPI } from '@/lib/api/news-service'
import { articleAPI } from '@/lib/api/article-service'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
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
    return NextResponse.json({ 
      success: true,
      articleId: result.id
    })
  } catch (error) {
    console.error('Error actualizando artículo:', error)
    return NextResponse.json({ error: 'Article update failed' }, { status: 500 })
  }
}
