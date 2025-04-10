import axios from 'axios'
import prisma from '@/lib/prisma'

const COINDESK_API_KEY = process.env.COINDESK_API_KEY
const COINDESK_API_URL = 'https://data-api.coindesk.com/news/v1/article/list'

// Fuentes prioritarias para noticias de criptomonedas
const PRIORITY_SOURCES = [
  'coindesk',
  'cointelegraph',
  'decrypt',
  'theblock',
  'cryptoslate',
  'bitcoinist',
  'cryptonews',
  'cryptopotato',
  'beincrypto',
  'ambcrypto'
]

// Términos de búsqueda para el mercado
const MARKET_TERMS = [
  'crypto market',
  'bitcoin price',
  'crypto trading',
  'cryptocurrency market',
  'digital assets',
  'crypto analysis',
  'market analysis',
  'crypto news',
  'blockchain news',
  'defi news'
]

export interface NewsArticle {
  title: string
  description: string
  pubDate: string
  source_name: string
  link: string
  tags: string[]
  categories: string[]
}

interface CategoryData {
  NAME: string
  CATEGORY: string
}

interface SourceData {
  NAME: string
  URL?: string
}

interface ApiNewsArticle {
  TITLE: string
  BODY: string
  PUBLISHED_ON: number
  URL: string
  SOURCE_DATA?: SourceData
  CATEGORY_DATA?: CategoryData[]
}

interface CoindeskResponse {
  data: CoindeskArticle[]
}

interface CoindeskArticle {
  title: string
  description: string
  published_at: string
  url: string
  tags: string[]
  categories: string[]
  data?: {
    title: string
    description: string
    published_at: string
    url: string
    tags: string[]
    categories: string[]
  }
}

interface CryptoAsset {
  name: string
  symbol: string
  price: number
  change24h: number
  volume24h: number
}

export const newsAPI = {
  async getCryptoNews(): Promise<NewsArticle[]> {
    try {
      console.log('Starting news fetch process...')
      
      const response = await axios.get(COINDESK_API_URL, {
        params: {
          lang: 'EN',
          limit: 30,
          sortBy: 'published_at',
          sortOrder: 'desc',
          tags: MARKET_TERMS.join(','),
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        headers: {
          'Authorization': `Bearer ${COINDESK_API_KEY}`,
          'Accept': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      
      if (!response.data) {
        console.warn('No data in API response')
        return []
      }

      // Log raw response for debugging
      console.log('Raw API response data structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        dataKeys: Object.keys(response.data)
      })

      let rawArticles: ApiNewsArticle[] = []
      
      // Handle the actual response structure we're getting
      if (Array.isArray(response.data)) {
        rawArticles = response.data
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        rawArticles = response.data.Data
      }

      console.log(`Found ${rawArticles.length} raw articles`)

      // Map the articles to our NewsArticle format
      const articles = rawArticles.map((article: ApiNewsArticle): NewsArticle => ({
        title: article.TITLE || '',
        description: article.BODY || '',
        pubDate: new Date(article.PUBLISHED_ON * 1000).toISOString(),
        source_name: article.SOURCE_DATA?.NAME || 'Unknown',
        link: article.URL || '',
        tags: article.CATEGORY_DATA?.map(cat => cat.NAME) || [],
        categories: article.CATEGORY_DATA?.map(cat => cat.CATEGORY) || []
      }))

      console.log(`Processed ${articles.length} articles`)
      articles.forEach((article, index) => {
        console.log(`Article ${index + 1}:`, {
          title: article.title,
          pubDate: article.pubDate,
          source: article.source_name
        })
      })

      // Filter and sort articles
      const filteredArticles = articles
        .filter(article => {
          if (!article.title) {
            console.log('Filtering out article with no title')
            return false
          }
          
          const hasRelevantTerms = MARKET_TERMS.some(term =>
            article.title.toLowerCase().includes(term.toLowerCase()) ||
            (article.description && article.description.toLowerCase().includes(term.toLowerCase()))
          )
          
          if (!hasRelevantTerms) {
            console.log(`Filtering out article with no relevant terms: ${article.title}`)
          }
          
          return hasRelevantTerms
        })
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, 10)

      console.log(`Final filtered articles: ${filteredArticles.length}`)
      console.log('Final articles:', JSON.stringify(filteredArticles, null, 2))

      return filteredArticles

    } catch (error) {
      console.error('Error fetching news:', error)
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data
        })
      }
      return []
    }
  },

  async getCryptoSpecificNews(symbol: string): Promise<NewsArticle[]> {
    try {
      const searchTerm = `${symbol} cryptocurrency`
      const response = await axios.get(`${COINDESK_API_URL}/search`, {
        params: {
          q: searchTerm,
          limit: 10
        }
      })

      const articles = response.data.map((article: CoindeskArticle) => ({
        title: article.title,
        description: article.description,
        pubDate: article.published_at,
        source_name: 'CoinDesk',
        link: article.url,
        tags: article.tags,
        categories: article.categories
      }))

      return articles.sort((a: NewsArticle, b: NewsArticle) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error)
      return []
    }
  },

  async generateArticle(cryptoData: any[]): Promise<string> {
    try {
      // Get general market news and ensure we have valid data
      const generalNews = await this.getCryptoNews()
      
      // Get top 5 cryptocurrencies
      const topCoins = cryptoData.slice(0, 5)
      
      // Get specific news for each top coin and ensure we have valid data
      const specificNewsPromises = topCoins.map(coin => 
        this.getCryptoSpecificNews(coin.symbol)
      )
      const specificNewsResults = await Promise.all(specificNewsPromises)
      
      // Format general market news section with validation
      const generalNewsSection = `## Recent Market News\n\n${
        generalNews.slice(0, 5).map(article => {
          if (!article.title) return ''
          return `
### ${article.title.trim()}
- **Source:** ${article.source_name || 'Unknown'}
- **Date:** ${new Date(article.pubDate).toLocaleDateString()}
- **Summary:** ${article.description ? 
    article.description.slice(0, 200).trim() + 
    (article.description.length > 200 ? '...' : '') : 
    'No description available'}`
        }).filter(Boolean).join('\n')}`

      // Format specific crypto news sections with validation
      const specificNewsSections = topCoins.map((coin, index) => {
        const coinNews = specificNewsResults[index] || []
        if (!coin.name || !coin.symbol) return ''
        
        return `## ${coin.name} (${coin.symbol}) Market Impact\n
### Market Data
- Current Price: $${typeof coin.price === 'number' ? coin.price.toFixed(2) : 'N/A'}
- 24h Change: ${typeof coin.change === 'number' ? coin.change.toFixed(2) : 'N/A'}%
- 24h Volume: $${typeof coin.volume === 'number' ? coin.volume.toLocaleString() : 'N/A'}

### Related News
${coinNews.slice(0, 3).map(article => {
  if (!article.title) return ''
  return `
#### ${article.title.trim()}
- **Source:** ${article.source_name || 'Unknown'}
- **Date:** ${new Date(article.pubDate).toLocaleDateString()}
- **Summary:** ${article.description ? 
    article.description.slice(0, 200).trim() + 
    (article.description.length > 200 ? '...' : '') : 
    'No description available'}`
}).filter(Boolean).join('\n')}`
      }).filter(Boolean).join('\n\n')

      // Combine all sections and ensure we have content
      const finalArticle = `# Crypto Market Analysis\n\n${generalNewsSection}\n\n${specificNewsSections}`
      
      if (finalArticle.length < 100) {
        throw new Error('Generated article content is too short')
      }

      return finalArticle
    } catch (error) {
      throw new Error('Failed to generate article: ' + (error as Error).message)
    }
  }
}

const processArticles = (articles: CoindeskArticle[]): NewsArticle[] => {
  return articles
    .map((article: CoindeskArticle) => {
      const data = article.data || article
      return {
        title: data.title,
        description: data.description,
        pubDate: data.published_at,
        source_name: 'Coindesk',
        link: data.url,
        tags: data.tags || [],
        categories: data.categories || []
      }
    })
    .sort((a: NewsArticle, b: NewsArticle) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    })
}

const getCryptoNews = async (): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get<CoindeskResponse>(COINDESK_API_URL)
    const articles = response.data.data.map((article: CoindeskArticle) => {
      return {
        title: article.title,
        description: article.description,
        pubDate: article.published_at,
        source_name: 'Coindesk',
        link: article.url,
        tags: article.tags || [],
        categories: article.categories || []
      }
    })
    return articles
  } catch (error) {
    console.error('Error fetching crypto news:', error)
    return []
  }
}

const getCryptoSpecificNews = async (symbol: string): Promise<NewsArticle[]> => {
  try {
    const searchTerm = `${symbol} cryptocurrency`
    const response = await axios.get(`${COINDESK_API_URL}/search`, {
      params: {
        q: searchTerm,
        limit: 10
      }
    })

    const articles = response.data.map((article: CoindeskArticle) => ({
      title: article.title,
      description: article.description,
      pubDate: article.published_at,
      source_name: 'CoinDesk',
      link: article.url,
      tags: article.tags,
      categories: article.categories
    }))

    return articles.sort((a: NewsArticle, b: NewsArticle) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error)
    return []
  }
}

const generateArticle = async (cryptoAssets: CryptoAsset[], generalNews: NewsArticle[]): Promise<string> => {
  try {
    // Process general news
    const generalNewsSection = generalNews.slice(0, 5).map(article => {
      return `
        Title: ${article.title}
        Description: ${article.description}
        Source: ${article.source_name}
        Date: ${article.pubDate}
      `
    }).join('\n')

    // Process specific news for top coins
    const specificNewsSection = await Promise.all(
      cryptoAssets.slice(0, 5).map(async (coin) => {
        const news = await getCryptoSpecificNews(coin.symbol)
        return `
          ${coin.name} (${coin.symbol}) News:
          ${news.slice(0, 3).map(article => `
            Title: ${article.title}
            Description: ${article.description}
            Source: ${article.source_name}
            Date: ${article.pubDate}
          `).join('\n')}
        `
      })
    )

    return `
      General Market News:
      ${generalNewsSection}

      Specific Cryptocurrency News:
      ${specificNewsSection.join('\n')}
    `
  } catch (error) {
    console.error('Error generating article:', error)
    throw error
  }
}