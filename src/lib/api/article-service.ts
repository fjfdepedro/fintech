import axios from 'axios'
import type { MarketData } from '@prisma/client'
import type { NewsArticle } from './news-service'
import { newsAPI } from './news-service'
import { marked } from 'marked'
import { formatDate } from '../utils/date'

const OPENROUTER_API_KEY = process.env.QWEN_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

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
      // Get the most recent timestamp from cryptoData
      const latestTimestamp = cryptoData.reduce((latest, crypto) => 
        crypto.timestamp > latest ? crypto.timestamp : latest,
        cryptoData[0]?.timestamp || new Date()
      )

      // Agrupar criptomonedas por categoría
      const categorizedCryptos = Object.entries(CRYPTO_CATEGORIES).map(([category, symbols]) => {
        const cryptos = cryptoData.filter(crypto => symbols.includes(crypto.symbol))
        return { category, cryptos }
      })

      // Obtener noticias específicas para las top 5 criptomonedas por market cap
      const topCryptos = cryptoData
        .sort((a, b) => b.market_cap - a.market_cap)
        .slice(0, 5)

      const specificNewsPromises = topCryptos.map(crypto => 
        newsAPI.getCryptoSpecificNews(crypto.symbol.toLowerCase())
      )

      const specificNewsResults = await Promise.allSettled(specificNewsPromises)
      const specificNews = specificNewsResults
        .map((result, index) => ({
          symbol: topCryptos[index].symbol,
          news: result.status === 'fulfilled' ? result.value : []
        }))
        .filter(item => item.news.length > 0)

      // Generar sección de datos de mercado por categoría
      const cryptoSection = categorizedCryptos.map(({ category, cryptos }) => `
${category} Cryptos:
${cryptos.map(crypto => `
${crypto.name} (${crypto.symbol}):
- Current Price: $${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
- 24h Change: ${crypto.change.toFixed(2)}%
- Volume: $${Number(crypto.volume).toLocaleString('en-US')}
- Market Cap: $${crypto.market_cap.toLocaleString('en-US')}
- Last Updated: ${formatDate(crypto.timestamp)}
`).join('\n')}
`).join('\n')

      // Generar sección de noticias generales
      const generalNewsSection = `
General Crypto Market News:
${generalNews.map(news => `
${news.title}
- Source: ${news.source_name}
- Date: ${formatDate(news.pubDate)}
- Summary: ${news.description ? news.description.substring(0, 200) + '...' : 'No description available'}
`).join('\n')}
`

      // Generar sección de noticias específicas
      const specificNewsSection = specificNews.map(({ symbol, news }) => `
News specifically about ${symbol}:
${news.map(item => `
${item.title}
- Source: ${item.source_name}
- Date: ${formatDate(item.pubDate)}
- Summary: ${item.description ? item.description.substring(0, 200) + '...' : 'No description available'}
`).join('\n')}
`).join('\n')

      const prompt = `Write a comprehensive and detailed financial analysis article with the exact title "Crypto Market Analysis: Trends, News Impact, and Technical Insights" (do not add any date to the title). The article should be thorough and integrate ALL the data and news provided below.

Follow this structure:

1. Market Overview
   - Overall market direction and sentiment
   - Total market capitalization analysis
   - Market dominance trends
   - Key market indicators

2. Key Market Trends
   - Category-by-category analysis
   - Emerging patterns and shifts
   - Comparative performance across categories
   - Notable sector rotations

3. Specific Crypto Updates:
   - Notable price movements with specific percentages
   - Trading volume analysis with comparisons
   - Market sentiment indicators
   - Correlation with news events

4. Individual Crypto Analysis:
   - Technical analysis for major cryptocurrencies
   - Support and resistance levels
   - Trading volume patterns
   - Market sentiment
   - News impact on price action

Instructions:
1. For the market overview:
   - Focus on the overall market direction with specific data points
   - Include total market capitalization with trends
   - Discuss market dominance trends with percentages
   - Analyze overall market sentiment

2. For key market trends:
   - Analyze the performance of cryptos within each category
   - Identify emerging patterns with specific examples
   - Note any significant shifts with data to support
   - Compare performance across different categories

3. For the top cryptos with specific news:
   - Include relevant price action with specific percentages
   - Discuss volume changes with comparisons
   - Note market sentiment with supporting evidence
   - Directly connect news events to price movements

4. For each individual crypto:
   - Focus on key price levels with specific values
   - Note significant support/resistance with context
   - Include volume analysis with trends
   - Mention any relevant news and its impact

IMPORTANT: This article should be comprehensive and detailed. Use ALL the data provided below. Reference specific numbers, percentages, and news items throughout the analysis. Connect market movements to news events. The article should be thorough and integrate every piece of information provided.

Keep the tone professional and analytical. Use specific numbers and percentages when discussing price changes. For each individual crypto analysis, be detailed and informative, focusing on the most important aspects of its current market position and recent developments.

Here is the current market data and news to base your analysis on:

${cryptoSection}

${generalNewsSection}

${specificNewsSection}

Please use ALL of this data to create a comprehensive analysis that connects market movements to news events and provides detailed insights across all categories.`

      const response = await axios.post(OPENROUTER_URL, {
        model: "qwen/qwq-32b:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        }
      })

      const markdownContent = response.data.choices[0].message.content

      // Procesar el contenido para añadir clases
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

      // Convert markdown to HTML with specific options
      const htmlContent = await marked(processedContent, {
        gfm: true,
        breaks: true
      })

      return {
        markdown: markdownContent,
        html: htmlContent
      }
    } catch (error) {
      console.error('Error generating article:', error)
      throw error
    }
  }
} 