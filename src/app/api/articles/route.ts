import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { newsAPI } from '@/lib/api/news-service'
import { articleAPI } from '@/lib/api/article-service'

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

async function getLatestCryptoData() {
  const cryptoData = await prisma.marketData.findMany({
    where: {
      type: 'CRYPTO'
    },
    orderBy: {
      timestamp: 'desc'
    },
    distinct: ['symbol'],
    select: {
      id: true,
      symbol: true,
      name: true,
      price: true,
      change: true,
      volume: true,
      market_cap: true,
      type: true,
      timestamp: true
    }
  })
  return cryptoData
}

export async function GET() {
  try {
    // Obtener el inicio y fin de la hora actual
    const now = new Date()
    const startOfHour = new Date(now.setMinutes(0, 0, 0))
    const endOfHour = new Date(now.setTime(now.getTime() + 60 * 60 * 1000 - 1))

    // Buscar el artículo más reciente dentro de la hora actual
    const existingArticle = await prisma.article.findFirst({
      where: {
        createdAt: {
          gte: startOfHour,
          lte: endOfHour
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingArticle) {
      return NextResponse.json({
        ...existingArticle,
        timestamp: existingArticle.createdAt // Add timestamp for backwards compatibility
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
        }
      })
    }

    // Obtener datos de criptomonedas y noticias en paralelo
    const [cryptoData, newsArticles] = await Promise.all([
      getLatestCryptoData(),
      newsAPI.getCryptoNews()
    ])

    // Generar nuevo artículo
    const content = await articleAPI.generateArticle(cryptoData, newsArticles)

    // Guardar el artículo
    const article = await prisma.article.create({
      data: {
        content: content.html
      }
    })

    return NextResponse.json(article, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error generating article:', error)
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}