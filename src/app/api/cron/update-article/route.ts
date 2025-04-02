import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { newsAPI } from '@/lib/api/news-service'
import { articleAPI } from '@/lib/api/article-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function updateArticleData() {
  console.log('Starting article update...')
  
  try {
    // 1. Get crypto data for the article
    const cryptoData = await prisma.marketData.findMany({
      where: {
        type: 'CRYPTO'
      },
      orderBy: {
        timestamp: 'desc'
      },
      distinct: ['symbol']
    })

    // 2. Get news
    const newsArticles = await newsAPI.getCryptoNews()
    
    // 3. Generate article using articleAPI
    const content = await articleAPI.generateArticle(cryptoData, newsArticles)
    
    // 4. Save the article
    const result = await prisma.article.create({
      data: {
        content: content.html,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('Article updated:', result.id)
    return result
  } catch (error) {
    console.error('Error generating article:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    // Verify if it's a Vercel Cron request
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
    console.error('Error in automatic article update:', error)
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
    console.error('Error in manual article update:', error)
    return NextResponse.json({ error: 'Article update failed' }, { status: 500 })
  }
}
