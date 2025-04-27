import axios from 'axios'
import type { MarketData, Prisma } from '@prisma/client'
import type { NewsArticle } from './news-service'
import { newsAPI } from './news-service'
import { marked } from 'marked'
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

function formatHtmlWithTailwind(html: string): string {
  // Primero envolvemos todo el contenido en un contenedor principal
  const wrappedHtml = `<article class="prose prose-slate dark:prose-invert max-w-none p-1 sm:p-8">${html}</article>`
  
  // Reemplazamos las etiquetas HTML con versiones estilizadas
  return wrappedHtml
    // Main title
    .replace(/<h1>(.*?)<\/h1>/g, '<div class="not-prose"><h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">$1</h1></div>')
    
    // Section headers
    .replace(/<h2>(.*?)<\/h2>/g, '<div class="not-prose"><h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-12">$1</h2></div>')
    
    // Subsection headers
    .replace(/<h3>(.*?)<\/h3>/g, '<div class="not-prose"><h3 class="scroll-m-20 text-2xl font-semibold tracking-tight mt-8">$1</h3></div>')
    
    // Paragraphs
    .replace(/<p>(.*?)<\/p>/g, '<p class="leading-7 [&:not(:first-child)]:mt-6">$1</p>')
    
    // Lists
    .replace(/<ul>/g, '<ul class="my-6 ml-6 list-disc [&>li]:mt-2">')
    
    // Code blocks
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, content) => {
      return `<div class="my-6 rounded-lg bg-muted p-4">
        <pre class="text-sm font-mono whitespace-pre-wrap">${content}</pre>
      </div>`
    })
    
    // News analysis sections
    .replace(/\* Impact:([^*]*)\* Affected/g, 
      '<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mb-6">' +
      '<div class="mb-4"><span class="font-semibold text-primary">Impact:</span>$1</div>' +
      '<div class="mb-4"><span class="font-semibold text-primary">Affected')
    
    .replace(/\* Affected Cryptocurrencies:([^*]*)\* Market Response/g, 
      'Cryptocurrencies:</span>$1</div>' +
      '<div class="mb-4"><span class="font-semibold text-primary">Market Response')
    
    .replace(/\* Market Response:([^*]*?)(?:\n\n|$)/g, ':</span>$1</div></div>')
    
    // Crypto data sections
    .replace(/- Price: \$([\d,.]+)/g, 
      '<div class="grid gap-1 mb-2">' +
      '<div class="flex items-center justify-between">' +
      '<span class="text-sm font-medium leading-none">Price</span>' +
      '<span class="text-sm text-primary">$$$1</span>' +
      '</div>')
    
    .replace(/- 24h Change: ([-\d.]+)%/g, (match, change) => {
      const isPositive = !change.startsWith('-')
      const colorClass = isPositive ? 'text-green-500' : 'text-red-500'
      return `<div class="flex items-center justify-between">
        <span class="text-sm font-medium leading-none">24h Change</span>
        <span class="text-sm ${colorClass}">${change}%</span>
      </div>`
    })
    
    .replace(/- Trading Volume: (.*?)(?=\n|$)/g, 
      '<div class="flex items-center justify-between">' +
      '<span class="text-sm font-medium leading-none">Trading Volume</span>' +
      '<span class="text-sm text-muted-foreground">$1</span>' +
      '</div>')
    
    .replace(/- Market Cap: (.*?)(?=\n|$)/g, 
      '<div class="flex items-center justify-between">' +
      '<span class="text-sm font-medium leading-none">Market Cap</span>' +
      '<span class="text-sm text-muted-foreground">$1</span>' +
      '</div></div>')
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
        //throw new Error('Generated content contains non-English characters')
      }

      if (problematicSymbolsRegex.test(markdownContent)) {
        console.error('Content contains problematic symbols')
        //throw new Error('Generated content contains problematic symbols')
      }

      if (!markdownContent || markdownContent.length < 100) {
        console.error('Generated content is too short:', markdownContent.length)
        //throw new Error('Generated content is invalid or too short')
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
      // Configure marked options
      marked.setOptions({
        gfm: true,
        breaks: true
      })

      // Convert markdown to HTML and format with Tailwind
      const htmlContent = await marked(processedContent)
      
      // Wrap the content in a container with base styles
      const wrappedHtml = `
        <div class="w-full max-w-4xl mx-auto bg-background text-foreground">
          <article class="prose prose-slate dark:prose-invert max-w-none p-1 sm:p-8">
            ${htmlContent}
          </article>
        </div>
      `
      
      const formattedHtml = formatHtmlWithTailwind(wrappedHtml)

      console.log('Article generation completed successfully')
      return {
        markdown: markdownContent,
        html: formattedHtml
      }
    } catch (error: unknown) {
      console.error('Error in article generation:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
} 