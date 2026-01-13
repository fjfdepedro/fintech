import axios from 'axios'
import type { MarketData } from '.prisma/client'
import axiosRetry from 'axios-retry'
import { PrismaClient, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { RawQueryResult } from '@/types/database'
import { v4 as uuidv4 } from 'uuid'

// Interfaces locales para los modelos
interface MessariMetricsModel {
  id: string
  symbol: string
  data: any
  timestamp: Date
  updated_at: Date
}

interface DefiProtocolDataModel {
  id: string
  symbol: string
  data: any
  timestamp: Date
  updated_at: Date
}

// Añadir tipos explícitos para el error
type ApiError = {
  response?: {
    status: number;
  };
};

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

// Configurar headers por defecto para todas las llamadas a CoinGecko
const coingeckoAxios = axios.create({
  baseURL: COINGECKO_API_URL,
  headers: {
    'x-cg-demo-api-key': COINGECKO_API_KEY
  }
})

// Configurar retry para el cliente específico de CoinGecko
axiosRetry(coingeckoAxios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error: ApiError) => error.response?.status === 429,
})

// Helper function to get current UTC timestamp
const getCurrentUTCTimestamp = () => {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ))
}

// Lista de criptomonedas específicas que queremos seguir
export const specificCoins = [
  // Top Tier
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'tether',
  'usd-coin', 'cardano', 'dogecoin', 'polkadot', 'solana',
  'avalanche-2', 'chainlink', 'uniswap', 'stellar', 'cosmos',
  'near', 'aptos', 'sui', 'the-open-network', 'tron',
  'wrapped-bitcoin', 'wrapped-steth', 'leo-token', 'lido-staked-ether',
  'shiba-inu',
  // Mid Tier
  'polygon', 'monero', 'bitcoin-cash', 'litecoin', 'dai',
  'ethereum-classic', 'hedera-hashgraph', 'filecoin', 'internet-computer',
  'arbitrum', 'optimism', 'cronos', 'algorand', 'vechain',
  'aave', 'eos', 'tezos', 'quant-network', 'elrond-erd-2',
  'pax-gold', 'theta-token', 'fantom', 'thorchain', 'pancakeswap-token',
  'curve-dao-token',
  // Nuevas Adiciones
  'render', // RNDR
  'sei-network', // SEI
  'floki', // FLOKI
  'dogwifhat', // WIF
  'hyperliquid', // HYPE
  'ondo', // ONDO
  'berachain', // BERA - Podría no estar disponible aún en CMC
  'story-protocol', // IP - Podría no estar disponible aún en CMC
  'solaxy', // SOLX - Podría no estar disponible aún en CMC
  'qubetics', // TICS - Podría no estar disponible aún en CMC
  // Criptomonedas mediáticas y populares
  'trump', // $TRUMP - Trump Coin
  'melania', // $MELANIA - Melania Coin
  'dawgz', // $DAGZ - Dawgz AI
  'book-of-meme', // BOME - Book of Meme
  'slothana', // SLOTH - Slothana
  'shytoshi-kusama', // $SHY - Shytoshi Kusama
  'venom' // VENOM - Venom
]

const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 1000

// Helper function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to process data in chunks
const processInChunks = async <T>(
  items: T[],
  chunkSize: number,
  processItem: (item: T) => Promise<any>
): Promise<any[]> => {
  const results: any[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(item => processItem(item).catch(error => {
        console.error(`Error processing item:`, error);
        return null;
      }))
    );
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
};

async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T | null> {
  try {
    // Intentar obtener de la base de datos primero
    const cached = await prisma.cache.findUnique({
      where: { key }
    })

    // Si existe y no ha expirado, devolver datos cacheados
    if (cached && Date.now() - cached.timestamp.getTime() < ttl * 1000) {
      return JSON.parse(cached.data) as T
    }

    // Si no existe o expiró, obtener nuevos datos
    const data = await fetchFn()
    
    // Guardar en caché
    await prisma.cache.upsert({
      where: { key },
      create: {
        key,
        data: JSON.stringify(data),
        timestamp: new Date()
      },
      update: {
        data: JSON.stringify(data),
        timestamp: new Date()
      }
    })

    return data
  } catch (error) {
    console.error('Error in getCachedData:', error)
    
    // Si hay error pero tenemos caché (aunque expirado), lo usamos como fallback
    const cached = await prisma.cache.findUnique({
      where: { key }
    })
    if (cached) {
      console.log('Using expired cache as fallback')
      return JSON.parse(cached.data) as T
    }
    
    return null
  }
}

// Tipos para las respuestas de las APIs
interface CoinGeckoResponse {
  data: {
    active_cryptocurrencies: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    active_exchanges: number;
  }
}

interface MessariResponse {
  data: {
    market_data?: {
      volume_last_24h?: number;
      real_volume_last_24h?: number;
    };
    roi_data?: {
      percent_change_last_1_week?: number;
      percent_change_last_1_month?: number;
    };
    mining_stats?: Record<string, number>;
    developer_activity?: Record<string, number>;
    supply?: {
      liquid?: number;
      circulating?: number;
      total?: number;
    };
  };
}

interface DefiLlamaResponse {
  tvl: number;
  chainTvls: Record<string, number>;
  currentChainTvls: Record<string, number>;
  tokens: Record<string, any>;
}

// Mapa de símbolos a IDs de CoinGecko
const COINGECKO_SYMBOL_TO_ID: Record<string, string> = {
  'sol': 'solana',
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'bnb': 'binancecoin',
  'xrp': 'ripple',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'dot': 'polkadot',
  'matic': 'polygon',
  'link': 'chainlink',
  'avax': 'avalanche-2',
  'uni': 'uniswap',
  'xlm': 'stellar',
  'atom': 'cosmos',
  'near': 'near',
  'apt': 'aptos',
  'sui': 'sui',
  'ton': 'the-open-network',
  'trx': 'tron',
  'wbtc': 'wrapped-bitcoin',
  'steth': 'staked-ether',
  'leo': 'leo-token',
  'shib': 'shiba-inu',
  'ltc': 'litecoin',
  'bch': 'bitcoin-cash',
  'etc': 'ethereum-classic',
  'hbar': 'hedera-hashgraph',
  'fil': 'filecoin',
  'icp': 'internet-computer',
  'arb': 'arbitrum',
  'op': 'optimism',
  'cro': 'crypto-com-chain',
  'algo': 'algorand',
  'vet': 'vechain',
  'aave': 'aave',
  'eos': 'eos',
  'xtz': 'tezos',
  'qnt': 'quant-network',
  'egld': 'elrond-erd-2',
  'paxg': 'pax-gold',
  'theta': 'theta-token',
  'ftm': 'fantom',
  'rune': 'thorchain',
  'cake': 'pancakeswap-token',
  'crv': 'curve-dao-token',
  'rndr': 'render-token',
  'sei': 'sei-network',
  'floki': 'floki',
  'wif': 'dogwifhat',
  'hype': 'hyperliquid',
  'ondo': 'ondo-finance',
  'bera': 'berachain',
  'ip': 'story-protocol',
  'solx': 'solaxy',
  'tics': 'qubetics'
}

// Cache de IDs de CoinGecko para evitar recrear el mapping
const coingeckoIdCache = new Map<string, string>()

async function getCoingeckoId(symbol: string): Promise<string> {
  const normalizedSymbol = symbol.toLowerCase()
  
  // Check cache first
  const cachedId = coingeckoIdCache.get(normalizedSymbol)
  if (cachedId) return cachedId

  // Get from mapping or use normalized symbol
  const id = COINGECKO_SYMBOL_TO_ID[normalizedSymbol] || normalizedSymbol
  coingeckoIdCache.set(normalizedSymbol, id)
  return id
}

// Mapa de símbolos comunes a sus slugs en Messari
const MESSARI_SYMBOL_TO_SLUG: Record<string, string> = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'bnb': 'binance',
  'sol': 'solana',
  'xrp': 'xrp',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'dot': 'polkadot',
  'matic': 'polygon',
  'link': 'chainlink',
  'avax': 'avalanche',
  'uni': 'uniswap',
  'xlm': 'stellar',
  'atom': 'cosmos',
  'near': 'near-protocol',
  'apt': 'aptos',
  'sui': 'sui',
  'ton': 'the-open-network',
  'trx': 'tron',
  'wbtc': 'wrapped-bitcoin',
  'steth': 'lido-staked-ether',
  'leo': 'leo-token',
  'shib': 'shiba-inu',
  'ltc': 'litecoin',
  'bch': 'bitcoin-cash',
  'etc': 'ethereum-classic',
  'hbar': 'hedera',
  'fil': 'filecoin',
  'icp': 'internet-computer',
  'arb': 'arbitrum',
  'op': 'optimism',
  'cro': 'cronos',
  'algo': 'algorand',
  'vet': 'vechain',
  'aave': 'aave',
  'eos': 'eos',
  'xtz': 'tezos',
  'qnt': 'quant-network',
  'egld': 'elrond-erd-2',
  'paxg': 'pax-gold',
  'theta': 'theta-token',
  'ftm': 'fantom',
  'rune': 'thorchain',
  'cake': 'pancakeswap-token',
  'crv': 'curve-dao-token',
  'rndr': 'render-token',
  'sei': 'sei-network',
  'floki': 'floki',
  'wif': 'dogwifhat',
  'hype': 'hyperliquid',
  'ondo': 'ondo-finance',
  'bera': 'berachain',
  'ip': 'story-protocol',
  'solx': 'solaxy',
  'tics': 'qubetics'
}

// Cache de slugs para evitar recrear el mapping
const slugCache = new Map<string, string>()

async function getMessariSlug(coinId: string): Promise<string> {
  const normalizedId = coinId.toLowerCase()
  
  // Check cache first
  const cachedSlug = slugCache.get(normalizedId)
  if (cachedSlug) return cachedSlug

  // Get from mapping or use normalized id
  const slug = MESSARI_SYMBOL_TO_SLUG[normalizedId] || normalizedId
  slugCache.set(normalizedId, slug)
  return slug
}

interface MessariMetricsRecord {
  id: string
  symbol: string
  data: any
  timestamp: Date
  updated_at: Date
}

interface DefiProtocolDataRecord {
  id: string
  symbol: string
  data: any
  timestamp: Date
  updated_at: Date
}

export const cryptoAPI = {
  async getTopCryptos(): Promise<MarketData[]> {
    try {
      console.log('Iniciando obtención de datos de CoinGecko...')
      
      // First, get all existing data from the database
      const existingData = await prisma.marketData.findMany({
        where: {
          symbol: {
            in: specificCoins.map(coin => coin.toUpperCase())
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol']
      })

      // Calculate which coins need updating (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const coinsToUpdate = specificCoins.filter(coin => {
        const existingCoin = existingData.find(data => 
          data.symbol.toLowerCase() === coin.toUpperCase()
        )
        return !existingCoin || existingCoin.timestamp < oneHourAgo
      })

      console.log(`${coinsToUpdate.length} monedas necesitan actualización`)
      
      if (coinsToUpdate.length === 0) {
        console.log('Todos los datos están actualizados, usando caché')
        return existingData
      }

      // Dividir las monedas a actualizar en lotes más pequeños
      const coinBatches = chunkArray(coinsToUpdate, BATCH_SIZE)
      const updatedData: any[] = []
      
      // Procesar cada lote con un retraso entre ellos
      for (let i = 0; i < coinBatches.length; i++) {
        const batch = coinBatches[i]
        console.log(`Procesando lote ${i + 1}/${coinBatches.length} (${batch.length} monedas)`)
        
        try {
          const response = await fetch(
            `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${batch.join(',')}&order=market_cap_desc&per_page=${batch.length}&page=1&sparkline=false&price_change_percentage=24h&locale=en`,
            {
              headers: {
                'x-cg-demo-api-key': COINGECKO_API_KEY || '',
              },
            }
          )
          
          if (!response.ok) {
            if (response.status === 429) {
              console.log(`Rate limit alcanzado en lote ${i + 1}, usando datos en caché para este lote`)
              // Find and use cached data for this batch
              const cachedBatchData = existingData.filter(data => 
                batch.includes(data.symbol.toLowerCase())
              )
              updatedData.push(...cachedBatchData)
              continue
            }
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const batchData = await response.json()
          if (Array.isArray(batchData)) {
            updatedData.push(...batchData)
          }
          
          // Esperar antes de la siguiente petición
          if (i < coinBatches.length - 1) {
            console.log(`Esperando ${DELAY_BETWEEN_BATCHES}ms antes del siguiente lote...`)
            await delay(DELAY_BETWEEN_BATCHES)
          }
        } catch (error) {
          console.error(`Error en lote ${i + 1}:`, error)
          // Use cached data for this batch on error
          const cachedBatchData = existingData.filter(data => 
            batch.includes(data.symbol.toLowerCase())
          )
          updatedData.push(...cachedBatchData)
          continue
        }
      }
      
      const currentTimestamp = getCurrentUTCTimestamp()
      
      // Convert updated data to MarketData format
      const newData = updatedData.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change: coin.price_change_percentage_24h || 0,
        volume: (coin.total_volume || 0).toString(),
        market_cap: coin.market_cap || 0,
        logo_url: coin.image?.thumb || null,
        timestamp: currentTimestamp
      }))

      // Combine new data with existing data that didn't need updating
      const finalData = [
        ...newData,
        ...existingData.filter(data => 
          !coinsToUpdate.includes(data.symbol.toLowerCase())
        )
      ]

      console.log(`Completado: ${finalData.length} monedas en total (${newData.length} actualizadas, ${finalData.length - newData.length} en caché)`)
      
      return finalData

    } catch (error) {
      console.error('Error obteniendo datos de CoinGecko:', error)
      // Return all cached data as fallback
      const cachedData = await prisma.marketData.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol'],
        take: specificCoins.length
      })
      
      if (cachedData.length > 0) {
        console.log('Usando datos en caché después de error:', cachedData.length, 'registros')
        return cachedData
      }
      throw error
    }
  },

  async getGlobalData() {
    try {
      // Buscar datos existentes no más viejos de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.cryptoMarketMetadata.findFirst({
        where: {
          timestamp: {
            gt: oneHourAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Si encontramos datos recientes, los devolvemos
      if (existingData) {
        return {
          data: {
            total_market_cap: { usd: existingData.total_market_cap },
            total_volume: { usd: existingData.total_volume_24h },
            market_cap_percentage: {
              btc: existingData.btc_dominance,
              eth: existingData.eth_dominance
            },
            active_cryptocurrencies: existingData.active_cryptos,
            active_exchanges: existingData.active_exchanges
          }
        }
      }

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await coingeckoAxios.get<CoinGeckoResponse>('/global')
      const globalData = response.data.data

      // Guardamos los nuevos datos en la base de datos
      await prisma.cryptoMarketMetadata.create({
        data: {
          id: `global-${Date.now()}`, // Generamos un ID único
          symbol: 'GLOBAL',
          total_market_cap: globalData.total_market_cap?.usd || 0,
          total_volume_24h: globalData.total_volume?.usd || 0,
          btc_dominance: globalData.market_cap_percentage?.btc || 0,
          eth_dominance: globalData.market_cap_percentage?.eth || 0,
          active_cryptos: globalData.active_cryptocurrencies || 0,
          active_exchanges: globalData.active_exchanges || 0,
          timestamp: new Date(),
          updated_at: new Date()
        }
      })

      return response.data
    } catch (error: unknown) {
      console.error('Error fetching global data:', error)
      
      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.cryptoMarketMetadata.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      })

      if (lastData) {
        return {
          data: {
            total_market_cap: { usd: lastData.total_market_cap },
            total_volume: { usd: lastData.total_volume_24h },
            market_cap_percentage: {
              btc: lastData.btc_dominance,
              eth: lastData.eth_dominance
            },
            active_cryptocurrencies: lastData.active_cryptos,
            active_exchanges: lastData.active_exchanges
          }
        }
      }

      throw error
    }
  },

  async getHistoricalData(symbol: string) {
    try {
      const historicalData = await prisma.marketData.findMany({
        where: {
          symbol: symbol.toUpperCase()
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 7,
        select: {
          timestamp: true,
          price: true
        }
      })

      return historicalData.map(data => {
        // Convert timestamp to UTC for consistency
        const utcTimestamp = new Date(Date.UTC(
          data.timestamp.getUTCFullYear(),
          data.timestamp.getUTCMonth(),
          data.timestamp.getUTCDate(),
          data.timestamp.getUTCHours(),
          data.timestamp.getUTCMinutes(),
          data.timestamp.getUTCSeconds()
        ))
        
        return {
          date: utcTimestamp,
          value: data.price
        }
      })
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      return [] // Return empty array on error
    }
  },

  async getCryptoDetail(symbol: string) {
    try {
      const coinId = await getCoingeckoId(symbol)

      // Buscar datos existentes no más viejos de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.cryptoDetails.findFirst({
        where: {
          symbol: symbol.toUpperCase(),
          timestamp: {
            gt: oneHourAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Si encontramos datos recientes, los devolvemos
      if (existingData?.data) {
        return existingData.data
      }

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await coingeckoAxios.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: true,
          market_data: true,
          community_data: true,
          developer_data: true,
          sparkline: true
        }
      })

      // Guardamos los nuevos datos en la base de datos
      await prisma.cryptoDetails.create({
        data: {
          symbol: symbol.toUpperCase(),
          data: response.data,
          timestamp: new Date(),
          updated_at: new Date()
        }
      })

      return response.data
    } catch (error) {
      console.error('Error fetching crypto detail:', error)

      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.cryptoDetails.findFirst({
        where: {
          symbol: symbol.toUpperCase()
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      if (lastData?.data) {
        return lastData.data
      }

      throw error
    }
  },

  async getOnChainData(symbol: string) {
    try {
      const coinId = await getCoingeckoId(symbol)

      // Buscar datos existentes no más viejos de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.onChainData.findFirst({
        where: {
          symbol: symbol.toUpperCase(),
          timestamp: {
            gt: oneHourAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Si encontramos datos recientes, los devolvemos
      if (existingData?.data) {
        return existingData.data
      }

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await coingeckoAxios.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 30,
          interval: 'daily'
        }
      })

      // Guardamos los nuevos datos en la base de datos
      await prisma.onChainData.create({
        data: {
          symbol: symbol.toUpperCase(),
          data: response.data,
          timestamp: new Date(),
          updated_at: new Date()
        }
      })

      return response.data
    } catch (error) {
      console.error('Error fetching on-chain data:', error)
      
      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.onChainData.findFirst({
        where: {
          symbol: symbol.toUpperCase()
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      if (lastData?.data) {
        return lastData.data
      }

      throw error
    }
  },

  async getExchangesList(symbol: string) {
    try {
      const coinId = await getCoingeckoId(symbol)
      
      // Buscar datos existentes no más viejos de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.exchangeData.findFirst({
        where: {
          symbol: symbol.toUpperCase(),
          timestamp: {
            gt: oneHourAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Si encontramos datos recientes, los devolvemos
      if (existingData?.tickers) {
        return existingData.tickers
      }

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await coingeckoAxios.get(`/coins/${coinId}/tickers`, {
        params: {
          include_exchange_logo: true,
          order: 'volume_desc'
        }
      })

      // Guardamos los nuevos datos en la base de datos
      await prisma.exchangeData.create({
        data: {
          symbol: symbol.toUpperCase(),
          tickers: response.data,
          timestamp: new Date()
        }
      })

      return response.data
    } catch (error) {
      console.error('Error fetching exchanges list:', error)
      
      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.exchangeData.findFirst({
        where: {
          symbol: symbol.toUpperCase()
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      if (lastData?.tickers) {
        return lastData.tickers
      }

      throw error
    }
  },

  async getMessariMetrics(coinId: string): Promise<MessariMetricsRecord | null> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.$queryRaw<RawQueryResult<MessariMetricsRecord[]>>`
        SELECT * FROM "MessariMetrics"
        WHERE symbol = ${coinId.toUpperCase()}
        AND timestamp > ${oneHourAgo}
        ORDER BY timestamp DESC
        LIMIT 1
      `

      if (existingData && existingData.length > 0) {
        return existingData[0]
      }

      // ✅ FIXED: Check if API key exists before making request
      if (!process.env.MESSARI_API_KEY) {
        console.warn('Messari API key not configured, skipping API call')
        // Try to return latest cached data
        const lastData = await prisma.$queryRaw<MessariMetricsRecord[]>(
          Prisma.sql`
            SELECT * FROM "MessariMetrics"
            WHERE symbol = ${coinId.toUpperCase()}
            ORDER BY timestamp DESC
            LIMIT 1
          `
        )
        return lastData?.length > 0 ? lastData[0] : null
      }

      const slug = await getMessariSlug(coinId)

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await axios.get(
        `https://data.messari.io/api/v1/assets/${slug}/metrics`,
        {
          headers: {
            'x-messari-api-key': process.env.MESSARI_API_KEY
          }
        }
      )

      const { data } = response.data
      const newMetrics: MessariMetricsRecord = {
        id: uuidv4(),
        symbol: coinId.toUpperCase(),
        data: {
          market_data: {
            volume_last_24h: data.market_data?.volume_last_24h ?? null,
            real_volume_last_24h: data.market_data?.real_volume_last_24h ?? null,
          },
          roi_data: {
            percent_change_last_1_week: data.roi_data?.percent_change_last_1_week ?? null,
            percent_change_last_1_month: data.roi_data?.percent_change_last_1_month ?? null,
          },
          mining_stats: data.mining_stats ?? null,
          developer_activity: data.developer_activity ?? null,
          supply: {
            liquid: data.supply?.liquid ?? null,
            circulating: data.supply?.circulating ?? null,
            total: data.supply?.total ?? null
          }
        },
        timestamp: new Date(),
        updated_at: new Date()
      }

      // Guardamos los nuevos datos en la base de datos
      await prisma.$executeRaw`
        INSERT INTO "MessariMetrics" (id, symbol, data, timestamp, updated_at)
        VALUES (${newMetrics.id}, ${newMetrics.symbol}, ${newMetrics.data}::jsonb, ${newMetrics.timestamp}, ${newMetrics.updated_at})
      `

      return newMetrics
    } catch (error) {
      console.error('Error fetching Messari metrics:', error)
      
      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.$queryRaw<MessariMetricsRecord[]>(
        Prisma.sql`
          SELECT * FROM "MessariMetrics"
          WHERE symbol = ${coinId.toUpperCase()}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      )

      if (lastData?.length > 0) {
        return lastData[0]
      }

      return null
    }
  },

  async getDefiProtocolData(symbol: string) {
    try {
      // Buscar datos existentes no más viejos de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const existingData = await prisma.$queryRaw<DefiProtocolDataRecord[]>(
        Prisma.sql`
          SELECT * FROM "DefiProtocolData"
          WHERE symbol = ${symbol.toUpperCase()}
          AND timestamp > ${oneHourAgo}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      )

      // Si encontramos datos recientes, los devolvemos
      if (existingData?.length > 0) {
        return existingData[0].data
      }

      // Mapa de símbolos a identificadores de DeFiLlama
      const symbolToProtocol: Record<string, string> = {
        'uni': 'uniswap',
        'aave': 'aave',
        'cake': 'pancakeswap',
        'crv': 'curve',
        'comp': 'compound',
        'mkr': 'maker',
        'sushi': 'sushiswap',
        'bal': 'balancer',
        'snx': 'synthetix',
        'yfi': 'yearn-finance',
        'link': 'chainlink',
        'grt': 'the-graph',
        'ren': 'ren',
        '1inch': '1inch',
        'alpha': 'alpha-finance',
        'bnt': 'bancor',
        'perp': 'perpetual-protocol',
        'dydx': 'dydx',
        'rook': 'rook',
        'badger': 'badger-dao',
        'rari': 'rari-capital',
        'fei': 'fei-protocol',
        'tribe': 'tribe',
        'rai': 'rai',
        'ohm': 'olympus',
        'spell': 'abracadabra',
        'mim': 'magic-internet-money',
        'time': 'wonderland',
        'wmemo': 'wrapped-memo',
        'sps': 'splinterlands',
        'slp': 'smooth-love-potion',
        'quick': 'quickswap',
        'joe': 'trader-joe',
        'magic': 'magic',
        'gmx': 'gmx',
        'velo': 'velodrome',
        'angle': 'angle',
        'pendle': 'pendle',
        'vsta': 'vesta-finance',
        'rdnt': 'radiant-capital',
        'thales': 'thales'
      }

      const normalizedSymbol = symbol.toLowerCase()
      const protocolId = symbolToProtocol[normalizedSymbol]

      // Si no es un protocolo DeFi conocido, retornamos valores por defecto
      if (!protocolId) {
        const defaultData = {
          isDefiProtocol: false,
          tvl: 0,
          chainTvls: {},
          currentChainTvls: {},
          tokens: {}
        }

        // Guardamos incluso los datos por defecto para evitar llamadas innecesarias
        await prisma.$executeRaw`
          INSERT INTO "DefiProtocolData" (id, symbol, data, timestamp, updated_at)
          VALUES (${`defi-${Date.now()}`}, ${symbol.toUpperCase()}, ${JSON.stringify(defaultData)}::jsonb, NOW(), NOW())
        `

        return defaultData
      }

      // Si no hay datos o son viejos, hacemos la petición a la API
      const response = await axios.get(`https://api.llama.fi/protocol/${protocolId}`)
      
      if (!response.data || response.data === 'Protocol not found') {
        throw new Error('Protocol not found')
      }

      const defiData = {
        isDefiProtocol: true,
        tvl: response.data.tvl || 0,
        chainTvls: response.data.chainTvls || {},
        currentChainTvls: response.data.currentChainTvls || {},
        tokens: response.data.tokens || {}
      }

      // Guardamos los nuevos datos en la base de datos
      await prisma.$executeRaw`
        INSERT INTO "DefiProtocolData" (id, symbol, data, timestamp, updated_at)
        VALUES (${`defi-${Date.now()}`}, ${symbol.toUpperCase()}, ${JSON.stringify(defiData)}::jsonb, NOW(), NOW())
      `

      return defiData
    } catch (error) {
      console.error('Error fetching DeFi data:', error)
      
      // En caso de error, intentamos devolver los últimos datos disponibles
      const lastData = await prisma.$queryRaw<DefiProtocolDataRecord[]>(
        Prisma.sql`
          SELECT * FROM "DefiProtocolData"
          WHERE symbol = ${symbol.toUpperCase()}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      )

      if (lastData?.length > 0) {
        return lastData[0].data
      }

      return {
        isDefiProtocol: false,
        tvl: 0,
        chainTvls: {},
        currentChainTvls: {},
        tokens: {}
      }
    }
  }
}
