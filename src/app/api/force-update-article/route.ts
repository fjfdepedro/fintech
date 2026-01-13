import { NextResponse } from 'next/server'
import { newsAPI } from '@/lib/api/news-service'
import { articleAPI } from '@/lib/api/article-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ⚠️ SOLO PARA DESARROLLO - Eliminar en producción o agregar autenticación
export async function GET(request: Request) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    console.log('🔄 Force updating article...')

    // 1. Get crypto data
    const cryptoData = await prisma.marketData.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      distinct: ['symbol'],
      take: 20 // Limit to top 20 for testing
    })

    console.log(`📊 Found ${cryptoData.length} crypto records`)

    // 2. Get news
    console.log('📰 Fetching news...')
    const newsArticles = await newsAPI.getCryptoNews()
    console.log(`📰 Found ${newsArticles?.length || 0} news articles`)

    // 3. Try to generate new article
    console.log('✍️ Generating article...')
    const content = await articleAPI.generateArticle(cryptoData, newsArticles)
    console.log('✅ Article generated successfully')

    // 4. Save the new article
    const result = await prisma.article.create({
      data: {
        content: content.html,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`💾 New article saved with ID: ${result.id}`)

    return NextResponse.json({
      success: true,
      articleId: result.id,
      cryptoDataCount: cryptoData.length,
      newsCount: newsArticles?.length || 0,
      preview: content.html.substring(0, 200) + '...'
    })
  } catch (error) {
    console.error('❌ Error in force article update:', error)
    return NextResponse.json({
      error: 'Article update failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
