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

      const prompt = `Write a comprehensive crypto market analysis article focusing on how recent news impacts cryptocurrency prices. Title: "Crypto Market Analysis: News Impact and Market Movements"

CRITICAL REQUIREMENTS:
1. This article MUST be written in English ONLY. No exceptions.
2. Never use any non-English characters, symbols, or text.
3. Never use special characters or symbols to represent numbers or percentages.
4. Use proper English formatting and punctuation.
5. If you cannot provide a value, use "N/A" instead of symbols or placeholders.
6. Format all numbers and percentages in standard English format (e.g., $50,000, 5.2%, etc.).
7. Use clear section headers and subheaders.
8. Break long paragraphs into shorter ones for better readability.
9. Use bullet points and numbered lists where appropriate.

STRUCTURE REQUIREMENTS:
1. Title and Introduction
   - Clear, descriptive title
   - Brief market overview
   - Key points to be covered

2. Individual News Analysis (for each major story)
   - Clear header for each news item
   - Cryptocurrencies affected (with current prices)
   - Key points in bullet points
   - Impact analysis with quantitative data
   - Historical context if relevant
   - Connection to broader market trends

3. Market Overview
   - Categorized analysis (Regulatory, Technical, Market Sentiment)
   - Data-driven insights
   - Trend analysis
   - Comparative analysis with historical events

4. Technical Analysis
   - Price movements and patterns
   - Volume analysis
   - Support and resistance levels
   - Market indicators

5. Market Sentiment
   - Social media trends
   - Trading volume analysis
   - Institutional activity
   - Retail investor behavior

6. Conclusion
   - Summary of key impacts
   - Future outlook
   - Risk factors to watch
   - Key takeaways in bullet points

CONTENT REQUIREMENTS:
1. For each cryptocurrency mentioned:
   - Current price
   - 24h price change
   - Trading volume
   - Market cap
   - Historical context

2. For each news event:
   - Quantitative impact on prices
   - Volume changes
   - Market cap changes
   - Historical precedents
   - Similar past events and their outcomes

3. Market Analysis:
   - Correlation between events
   - Chain reactions
   - Sector-wide impacts
   - Long-term implications

4. Data Presentation:
   - Use tables for price comparisons
   - Use bullet points for key facts
   - Use numbered lists for sequential events
   - Include percentage changes
   - Show volume and market cap data

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
          'X-Title': 'Crypto Market Analysis'
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