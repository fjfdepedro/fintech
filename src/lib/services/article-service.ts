import prisma from '@/lib/prisma'
import { articleAPI } from '@/lib/api/article-service'
import { newsAPI } from '@/lib/api/news-service'

const UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hora (para que coincida con la revalidación de la página)

export async function checkAndUpdateArticle() {
  try {
    // 1. Check last update time
    const lastArticle = await prisma.article.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    })

    const now = new Date()
    const lastUpdateTime = lastArticle?.createdAt
    const needsUpdate = !lastUpdateTime || 
      (now.getTime() - lastUpdateTime.getTime()) > UPDATE_INTERVAL

    if (needsUpdate) {
      try {
        // 2. Get crypto data for the article
        const cryptoData = await prisma.marketData.findMany({
          where: {
            type: 'CRYPTO'
          },
          orderBy: {
            timestamp: 'desc'
          },
          distinct: ['symbol']
        })

        // 3. Get news
        const newsArticles = await newsAPI.getCryptoNews()
        
        // 4. Generate article using articleAPI
        const content = await articleAPI.generateArticle(cryptoData, newsArticles)
        
        // 5. Save the article
        const result = await prisma.article.create({
          data: {
            content: content.html,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        console.log('Article updated:', result.id)
        return { updated: true, articleId: result.id }
      } catch (error) {
        console.error('Error generating article:', error)
        // If update fails, return existing article
        return { updated: false, error: 'API or database error' }
      }
    }

    return { updated: false, reason: 'Article is up to date' }
  } catch (error) {
    console.error('Error checking article:', error)
    return { updated: false, error: 'Database check error' }
  }
}

export async function getLatestArticle() {
  try {
    const article = await prisma.article.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return article
  } catch (error) {
    console.error('Error fetching latest article:', error)
    return null
  }
} 