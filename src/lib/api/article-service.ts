import axios from 'axios'
import type { MarketData, Prisma } from '@prisma/client'
import type { NewsArticle } from './news-service'
import { newsAPI } from './news-service'
import { marked } from 'marked'
import { formatDate } from '../utils/date'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const OPENROUTER_API_KEY = process.env.QWEN_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const prisma = new PrismaClient()

// Agrupar criptomonedas por categoría
const CRYPTO_CATEGORIES = {
  'Layer 1': ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'NEAR', 'ATOM', 'TON', 'TRX', 'XTZ', 'EGLD', 'ICP', 'FIL', 'HBAR', 'ETC', 'LTC', 'BCH'],
  'DeFi': ['UNI', 'LINK', 'AAVE', 'CRV', 'CAKE'],
  'Stablecoins': ['USDT', 'USDC', 'DAI', 'PAXG'],
  'Meme Coins': ['DOGE', 'SHIB', 'FLOKI'],
  'Layer 2': ['ARB', 'OP', 'MATIC', 'CRO'],
  'Emerging Ecosystems': ['SUI', 'APT', 'INJ', 'SEI', 'ALGO', 'VET', 'QNT', 'THETA', 'FTM', 'RUNE'],
  'Wrapped Assets': ['WBTC', 'WSTETH'],
  'Exchange Tokens': ['BNB', 'LEO']
}

export interface ArticleResponse {
  markdown: string
  html: string
}

export const articleAPI = {
  async generateArticle(cryptoData: MarketData[], generalNews: NewsArticle[]): Promise<ArticleResponse> {
    try {
      console.log('Starting article generation process...')
      console.log(`Initial data: ${cryptoData.length} crypto assets and ${generalNews.length} news articles`)

      // Verificar si tenemos noticias y intentar obtenerlas si no hay
      if (!generalNews || generalNews.length === 0) {
        console.log('No news provided, attempting to fetch news...')
        try {
          generalNews = await newsAPI.getCryptoNews()
          console.log(`Fetched ${generalNews.length} news articles:`)
          generalNews.forEach(news => console.log(`- ${news.title}`))
        } catch (error) {
          console.error('Failed to fetch news:', error)
          generalNews = [] // Initialize as empty array if fetch fails
        }
      }

      // Get top 5 cryptocurrencies
      const topCoins = cryptoData
        .sort((a, b) => b.market_cap - a.market_cap)
        .slice(0, 5)
      
      console.log('Top cryptocurrencies selected:', topCoins.map(c => c.symbol).join(', '))

      // Format general market news section
      const generalNewsSection = generalNews.length > 0 ? generalNews.slice(0, 5).map(article => {
        if (!article.title) return ''
        const newsDate = new Date(article.pubDate).toLocaleDateString()
        return `
Title: ${article.title.trim()}
Source: ${article.source_name || 'Unknown'}
Date: ${newsDate}
Summary: ${article.description ? 
          article.description.slice(0, 2500).trim() + 
          (article.description.length > 2500 ? '...' : '') : 
          'No description available'}`
      }).filter(Boolean).join('\n') : ''

      // Create market data section
      const cryptoSection = cryptoData.map(coin => `
${coin.name} (${coin.symbol}):
Price: $${typeof coin.price === 'number' ? coin.price.toFixed(2) : 'N/A'}
24h Change: ${typeof coin.change === 'number' ? coin.change.toFixed(2) : 'N/A'}%`
      ).join('\n\n')

      console.log('Constructing final prompt...')

      const prompt = `Write a comprehensive crypto market analysis article in proper Markdown format. Use standard Markdown syntax for all formatting.

CRITICAL REQUIREMENTS:
1. Use ONLY standard Markdown syntax:
   - # for main title
   - ## for section headers
   - ### for subsections
   - * or - for bullet points
   - 1. 2. 3. for numbered lists
   - ** or __ for bold text
   - * or _ for italic text
2. Format the article with this exact structure:
   # Crypto Market Analysis: News Impact and Market Movements

   [Brief introduction paragraph]

   ## Market Overview
   [Content]

   ## Individual News Analysis
   [Content]

   ## Technical Analysis
   [Content]

   ## Market Sentiment
   [Content]

   ## Conclusion
   [Content]

3. For cryptocurrency data, use this format:
   ### [Crypto Name] (SYMBOL)
   - Price: $X,XXX.XX
   - 24h Change: X.XX%
   - Trading Volume: $X,XXX,XXX
   - Market Cap: $X,XXX,XXX

4. For news analysis, use this format:
   ### [News Title]
   - Impact: [Description]
   - Affected Cryptocurrencies: [List]
   - Market Response: [Analysis]

Here is the data to analyze:

Market Data:

${cryptoSection}

Recent Market News:

${generalNewsSection}`

      // Guardar el prompt y logging
      if (IS_DEVELOPMENT) {
        try {
          const publicDir = path.join(process.cwd(), 'public')
          const promptFilePath = path.join(publicDir, 'qwen-prompt.txt')
          
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true })
          }
          
          fs.writeFileSync(promptFilePath, prompt)
          console.log(`Prompt saved to: ${promptFilePath}`)
          console.log('Prompt structure:')
          console.log('- Market Data sections:', cryptoSection.split('\n\n').length)
          console.log('- General News articles:', generalNews.length)
        } catch (error) {
          console.error('Error saving prompt:', error)
        }
      }

      console.log('Sending request to OpenRouter API...')
      const response = await axios.post(OPENROUTER_URL, {
        model: "mistralai/mistral-small-3.1-24b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a professional cryptocurrency market analyst. Your primary rule is to write EXCLUSIVELY in English. Never use any other language, characters, or symbols. If you cannot provide a value, use 'N/A'. Format all numbers and percentages in standard English format."
          },
          {
            role: "user",
            content: prompt.trim()
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        stop: ["</s>", "```"]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://your-site.com',
          'X-Title': 'Crypto Market Analysis',
          'HTTP-Origin': 'https://your-site.com'
        },
        timeout: 60000
      })

      console.log('OpenRouter API response received')
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Invalid response structure:', JSON.stringify(response.data, null, 2))
        throw new Error('Failed to generate article content: Invalid API response')
      }

      const markdownContent = response.data.choices[0].message.content.trim()
      console.log('Generated content length:', markdownContent.length)

      // Validate content for non-English characters and symbols
      const nonEnglishRegex = /[^\x00-\x7F]/g
      const problematicSymbolsRegex = /[{}[\]\\]/g
      
      if (nonEnglishRegex.test(markdownContent)) {
        console.error('Content contains non-English characters')
        throw new Error('Generated content contains non-English characters')
      }

      if (problematicSymbolsRegex.test(markdownContent)) {
        console.error('Content contains problematic symbols')
        throw new Error('Generated content contains problematic symbols')
      }

      if (!markdownContent || markdownContent.length < 100) {
        console.error('Generated content is too short:', markdownContent.length)
        throw new Error('Generated content is invalid or too short')
      }

      console.log('Processing markdown content...')
      let processedContent = markdownContent
        // Ensure title is correct and formatted
        .replace(/^.*?Crypto Market Analysis: Trends, News Impact, and Technical Insights.*?\n/m, '<h1 class="text-3xl font-bold mb-6">Crypto Market Analysis: Trends, News Impact, and Technical Insights</h1>\n')
        // Format section headers
        .replace(/^(\d+)\.\s+([^\n]+)/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4 pb-2 border-b">$1. $2</h2>')
        // Format category headers
        .replace(/^(Layer \d|DeFi|Meme Coins|Emerging Ecosystems|Stablecoins):/gm, '<h3 class="text-xl font-medium mt-6 mb-3">$1</h3>')
        // Format performance and other labels
        .replace(/Performance:/g, '<span class="font-medium text-muted-foreground">Performance:</span>')
        .replace(/News Impact:/g, '<span class="font-medium text-muted-foreground">News Impact:</span>')
        .replace(/Trends:/g, '<span class="font-medium text-muted-foreground">Trends:</span>')
        .replace(/Future Implications:/g, '<span class="font-medium text-muted-foreground">Future Implications:</span>')
        // Remove any remaining subtitle class references
        .replace(/<div class="subtitle">.*?<\/div>/g, '')

      console.log('Converting to HTML...')
      const htmlContent = await marked(processedContent, {
        gfm: true,
        breaks: true
      })

      console.log('Article generation completed successfully')
      return {
        markdown: markdownContent,
        html: htmlContent,
      }
    } catch (error: unknown) {
      console.error('Error in article generation:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
} 