import { NextResponse } from 'next/server'
import { getLatestArticle } from '@/lib/services/article-service'

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    // During build, only get data from database
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_RUNTIME === 'edge') {
      const article = await getLatestArticle()
      if (!article) {
        return NextResponse.json({ error: 'No article found' }, { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store'
          }
        })
      }
      return NextResponse.json(article, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
        }
      })
    }

    // During runtime, get latest article
    const article = await getLatestArticle()
    if (!article) {
      return NextResponse.json({ error: 'No article found' }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store'
        }
      })
    }

    return NextResponse.json(article, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ error: 'Failed to fetch article' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  }
}