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
    
    try {
      // 3. Try to generate new article
      const content = await articleAPI.generateArticle(cryptoData, newsArticles)
      
      // 4. Save the new article
      const result = await prisma.article.create({
        data: {
          content: content.html,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('New article created:', result.id)
      return {
        article: result,
        status: 'generated' as const,
        source: 'new'
      }
    } catch (generationError) {
      console.warn('Failed to generate new article:', generationError)
      console.log('Falling back to most recent article...')

      // 5. Fallback: Get most recent article from database
      const mostRecentArticle = await prisma.article.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        where: {
          content: {
            not: ''
          }
        }
      })

      if (!mostRecentArticle) {
        throw new Error('No fallback article available in database')
      }

      // 6. Create new article entry with existing content but updated timestamp
      const result = await prisma.article.create({
        data: {
          content: mostRecentArticle.content,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('Created article from fallback data:', result.id)
      return {
        article: result,
        status: 'fallback' as const,
        source: 'existing',
        originalArticleId: mostRecentArticle.id
      }
    }
  } catch (error) {
    console.error('Error in article update process:', error)
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
      articleId: result.article.id
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
      articleId: result.article.id,
      status: result.status,
      source: result.source,
      ...(result.status === 'fallback' && { originalArticleId: result.originalArticleId })
    })
  } catch (error) {
    console.error('Error in manual article update:', error)
    return NextResponse.json({ 
      error: 'Article update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
