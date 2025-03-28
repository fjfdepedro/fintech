import axios from 'axios'

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY
const NEWSDATA_API_URL = 'https://newsdata.io/api/1'

// Términos de búsqueda basados en las criptomonedas del proyecto
const MAIN_CRYPTOS = [
  'bitcoin OR btc',
  'ethereum OR eth',
  'solana OR sol',
  'binance OR bnb',
  'ripple OR xrp',
  'cardano OR ada',
  'polkadot OR dot',
  'chainlink OR link',
  'avalanche OR avax',
  'uniswap OR uni'
].join(' OR ')

const EMERGING_CRYPTOS = [
  'arbitrum OR arb',
  'optimism OR op',
  'sui',
  'aptos OR apt',
  'injective OR inj',
  'sei network'
].join(' OR ')

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

interface NewsResponse {
  status: string
  totalResults: number
  results: NewsArticle[]
}

export interface NewsArticle {
  title: string
  description: string | null
  pubDate: string
  source_name: string
  duplicate?: boolean
}

export const newsAPI = {
  async getCryptoNews(): Promise<NewsArticle[]> {
    try {
      // Primero intentamos obtener noticias de las principales criptos
      const mainResponse = await axios.get<NewsResponse>(`${NEWSDATA_API_URL}/news`, {
        params: {
          apikey: NEWSDATA_API_KEY,
          language: 'en',
          category: 'business',
          q: '(bitcoin OR ethereum OR solana OR binance OR ripple OR cardano OR polkadot OR chainlink OR avalanche OR uniswap) AND (price OR market OR trading OR blockchain OR defi OR crypto OR cryptocurrency)',
          size: 10
        }
      })

      // Luego intentamos obtener noticias de ecosistemas emergentes
      const emergingResponse = await axios.get<NewsResponse>(`${NEWSDATA_API_URL}/news`, {
        params: {
          apikey: NEWSDATA_API_KEY,
          language: 'en',
          category: 'business',
          q: '(arbitrum OR optimism OR sui OR aptos OR injective OR sei) AND (ecosystem OR development OR upgrade OR partnership OR launch OR integration)',
          size: 10
        }
      })

      const allNews = [
        ...(mainResponse.data.status === 'success' ? mainResponse.data.results : []),
        ...(emergingResponse.data.status === 'success' ? emergingResponse.data.results : [])
      ]

      return allNews
        .filter(news => {
          // Filtrar noticias sin título o descripción
          if (!news.title || !news.description) return false
          
          // Filtrar contenido solo disponible en planes pagados
          if (news.title.toLowerCase().includes('only available in paid plans') ||
              news.description.toLowerCase().includes('only available in paid plans')) return false
          
          // Filtrar contenido duplicado
          if (news.duplicate) return false
          
          // Filtrar por términos relevantes en el título o descripción
          const relevantTerms = ['price', 'market', 'trading', 'blockchain', 'defi', 'crypto', 'cryptocurrency']
          const hasRelevantTerms = relevantTerms.some(term => 
            news.title.toLowerCase().includes(term) || 
            (news.description && news.description.toLowerCase().includes(term))
          )
          
          // Priorizar fuentes conocidas
          const isPrioritySource = PRIORITY_SOURCES.includes(news.source_name.toLowerCase())
          
          return hasRelevantTerms || isPrioritySource
        })
        .map(news => ({
          title: news.title,
          description: news.description,
          pubDate: news.pubDate,
          source_name: news.source_name
        }))
        .sort((a, b) => {
          // Priorizar fuentes conocidas
          const aPriority = PRIORITY_SOURCES.includes(a.source_name.toLowerCase())
          const bPriority = PRIORITY_SOURCES.includes(b.source_name.toLowerCase())
          if (aPriority && !bPriority) return -1
          if (!aPriority && bPriority) return 1
          return 0
        })
        .slice(0, 10)

    } catch (error) {
      console.error('Error fetching crypto news:', error)
      return []
    }
  },

  async getCryptoSpecificNews(symbol: string): Promise<NewsArticle[]> {
    try {
      // Construir una búsqueda más precisa basada en el símbolo
      const searchQuery = symbol.toLowerCase()
      const commonNames: Record<string, string> = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'sol': 'solana',
        'bnb': 'binance',
        'xrp': 'ripple',
        'ada': 'cardano',
        'dot': 'polkadot',
        'link': 'chainlink',
        'avax': 'avalanche',
        'uni': 'uniswap',
        'arb': 'arbitrum',
        'op': 'optimism',
        'apt': 'aptos',
        'inj': 'injective'
      }

      const searchTerm = `${searchQuery} ${commonNames[searchQuery.toLowerCase()] || ''}`
        .trim()
        .replace(/\s+/g, ' OR ')

      const { data } = await axios.get<NewsResponse>(`${NEWSDATA_API_URL}/news`, {
        params: {
          apikey: NEWSDATA_API_KEY,
          language: 'en',
          category: 'business',
          q: `(${searchTerm}) AND (price OR market OR trading OR blockchain OR defi OR crypto OR cryptocurrency) AND (source:coindesk OR source:cointelegraph OR source:decrypt OR source:theblock OR source:cryptoslate OR source:bitcoinist OR source:cryptonews OR source:cryptopotato OR source:beincrypto OR source:ambcrypto)`,
          size: 10
        }
      })

      if (data.status !== 'success') {
        return []
      }

      return data.results
        .filter(news => {
          // Filtrar noticias sin título o descripción
          if (!news.title || !news.description) return false
          
          // Filtrar contenido solo disponible en planes pagados
          if (news.title.toLowerCase().includes('only available in paid plans') ||
              news.description.toLowerCase().includes('only available in paid plans')) return false
          
          // Filtrar contenido duplicado
          if (news.duplicate) return false
          
          return true
        })
        .map(news => ({
          title: news.title,
          description: news.description,
          pubDate: news.pubDate,
          source_name: news.source_name
        }))
        .sort((a, b) => {
          // Priorizar fuentes conocidas
          const aPriority = PRIORITY_SOURCES.includes(a.source_name.toLowerCase())
          const bPriority = PRIORITY_SOURCES.includes(b.source_name.toLowerCase())
          if (aPriority && !bPriority) return -1
          if (!aPriority && bPriority) return 1
          return 0
        })
        .slice(0, 10)
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error)
      return []
    }
  }
}