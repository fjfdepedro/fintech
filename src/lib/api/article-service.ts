import axios from 'axios'
import type { MarketData } from '@prisma/client'
import type { NewsArticle } from './news-service'
import { newsAPI } from './news-service'
import { marked } from 'marked'

const OPENROUTER_API_KEY = process.env.QWEN_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Agrupar criptomonedas por categoría
const CRYPTO_CATEGORIES = {
  'Layer 1': ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'NEAR', 'ATOM', 'TON'],
  'DeFi': ['UNI', 'LINK'],
  'Stablecoins': ['USDT'],
  'Meme Coins': ['DOGE', 'FLOKI'],
  'Emerging Ecosystems': ['ARB', 'OP', 'SUI', 'APT', 'INJ', 'SEI']
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
${category} Cryptocurrencies:
${cryptos.map(crypto => `
${crypto.name} (${crypto.symbol}):
- Current Price: $${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
- 24h Change: ${crypto.change.toFixed(2)}%
- Volume: $${Number(crypto.volume).toLocaleString('en-US')}
- Market Cap: $${crypto.market_cap.toLocaleString('en-US')}
- Last Updated: ${new Date(crypto.timestamp).toLocaleString()}
`).join('\n')}
`).join('\n')

      // Generar sección de noticias generales
      const generalNewsSection = `
General Crypto Market News:
${generalNews.map(news => `
${news.title}
- Source: ${news.source_name}
- Date: ${new Date(news.pubDate).toLocaleString()}
- Summary: ${news.description ? news.description.substring(0, 200) + '...' : 'No description available'}
`).join('\n')}
`

      // Generar sección de noticias específicas
      const specificNewsSection = specificNews.map(({ symbol, news }) => `
News specifically about ${symbol}:
${news.map(item => `
${item.title}
- Source: ${item.source_name}
- Date: ${new Date(item.pubDate).toLocaleString()}
- Summary: ${item.description ? item.description.substring(0, 200) + '...' : 'No description available'}
`).join('\n')}
`).join('\n')

      const prompt = `Write a comprehensive financial analysis article with the exact title "Comprehensive Financial Analysis of Cryptocurrency Markets" (do not add any date to the title). Follow this structure:

1. Market Overview by Category:
${cryptoSection}

2. General Market News and Trends:
${generalNewsSection}

3. Specific Cryptocurrency Updates:
${specificNewsSection}

4. Individual Cryptocurrency Analysis:
${cryptoData.map(crypto => `
${crypto.name} (${crypto.symbol}):
- Current Price: $${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
- 24h Change: ${crypto.change.toFixed(2)}%
- Volume: $${Number(crypto.volume).toLocaleString('en-US')}
- Market Cap: $${crypto.market_cap.toLocaleString('en-US')}
- Category: ${Object.entries(CRYPTO_CATEGORIES).find(([_, symbols]) => symbols.includes(crypto.symbol))?.[0] || 'Other'}
- Last Updated: ${new Date(crypto.timestamp).toLocaleString()}
`).join('\n')}

Please write a comprehensive market analysis without including any date in the title. Focus on:
1. A brief market overview highlighting the most significant movements across categories.
2. For each category:
   - Analyze the performance of cryptocurrencies within that category
   - Discuss any relevant news and their impact on prices
   - Identify trends or patterns specific to that category
3. For the top cryptocurrencies with specific news:
   - Analyze how recent news events have impacted their price movements
   - Discuss potential future implications
4. For each individual cryptocurrency:
   - Provide a concise analysis of its current performance
   - Highlight any specific news or events affecting it
   - Discuss its position within its category
   - Give a brief technical analysis based on price action and volume
5. A final summary that:
   - Connects market trends across categories
   - Highlights key correlations between news events and price movements
   - Provides a forward-looking perspective based on the current data

Use professional financial language and focus on market analysis. Highlight any correlations between market movements and news events. Include specific price points and percentage changes when relevant. For each individual cryptocurrency analysis, keep it concise but informative, focusing on the most important aspects of its current market position and recent developments.`

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
        // Add date header at the beginning
        .replace(/^/, `<div class="date">Last Update: ${new Date(latestTimestamp).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric'
        })} at ${new Date(latestTimestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })} GMT</div>\n\n`)
        // Ensure title is correct without date
        .replace(/^[\s\S]*?(?=\n)/, '<p><strong>Comprehensive Financial Analysis of Cryptocurrency Markets</strong></p>')
        // Añadir clase al subtítulo
        .replace(/(Combining Market Data with Recent News)/, '<div class="subtitle">$1</div>')
        // Añadir clase a los números de sección
        .replace(/^(\d+)\.\s+([^\n]+)/gm, '<span class="section-number">$1.</span> <span class="category-title">$2</span>')
        // Añadir clase a las etiquetas Performance:
        .replace(/Performance:/g, '<span class="performance">Performance:</span>')
        // Mejorar el formato de las categorías
        .replace(/^(Layer \d|DeFi|Meme Coins|Emerging Ecosystems|Stablecoins):/gm, '<span class="category-title">$1:</span>')

      // Convert markdown to HTML
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