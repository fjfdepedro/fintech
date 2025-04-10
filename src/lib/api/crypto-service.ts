import axios from 'axios'
import type { MarketData } from '.prisma/client'
import axiosRetry from 'axios-retry'
import prisma from '../prisma'

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
  data: any;
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

export const cryptoAPI = {
  async getTopCryptos(): Promise<MarketData[]> {
    try {
      console.log('Iniciando obtención de datos de CoinGecko...')
      
      // First, get all existing data from the database
      const existingData = await prisma.marketData.findMany({
        where: {
          type: 'CRYPTO',
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
        type: 'CRYPTO',
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
        where: {
          type: 'CRYPTO'
        },
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
      const response = await coingeckoAxios.get<CoinGeckoResponse>('/global')
      return response.data.data
    } catch (error: unknown) {
      console.error('Error fetching global data:', error)
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
      const response = await coingeckoAxios.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: true,
          market_data: true,
          community_data: true,
          developer_data: true,
          sparkline: true
        },
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching crypto detail:', error)
      throw error
    }
  },

  async getOnChainData(symbol: string) {
    try {
      const coinId = await getCoingeckoId(symbol)
      const response = await coingeckoAxios.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 30,
          interval: 'daily'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching on-chain data:', error)
      throw error
    }
  },

  async getExchangesList(symbol: string) {
    try {
      const coinId = await getCoingeckoId(symbol)
      const response = await coingeckoAxios.get(`/coins/${coinId}/tickers`, {
        params: {
          include_exchange_logo: true,
          order: 'volume_desc'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching exchanges list:', error)
      throw error
    }
  },

  async getMessariMetrics(coinId: string) {
    const slug = await getMessariSlug(coinId)
    const CACHE_KEY = `messari-metrics-${slug}`
    const ONE_DAY = 86400 // 24 horas en segundos

    return getCachedData(
      CACHE_KEY,
      async () => {
        try {
          const response = await axios.get(
            `https://data.messari.io/api/v1/assets/${slug}/metrics`,
            {
              headers: {
                'x-messari-api-key': process.env.MESSARI_API_KEY
              }
            }
          )

          const { data } = response.data
          return {
            market_data: {
              volume_last_24h: data.market_data?.volume_last_24h,
              real_volume_last_24h: data.market_data?.real_volume_last_24h,
            },
            roi_data: {
              percent_change_last_1_week: data.roi_data?.percent_change_last_1_week,
              percent_change_last_1_month: data.roi_data?.percent_change_last_1_month,
            },
            mining_stats: data.mining_stats,
            developer_activity: data.developer_activity,
            supply: {
              liquid: data.supply?.liquid,
              circulating: data.supply?.circulating,
              total: data.supply?.total
            }
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            // Rate limit error - return null to trigger cache fallback
            if (error.response?.status === 429) {
              console.error('Messari rate limit reached')
              return null
            }
            // Invalid slug/asset not found
            if (error.response?.status === 404) {
              console.error(`Messari asset not found: ${slug}`)
              return null
            }
          }
          console.error('Error fetching Messari metrics:', error)
          return null
        }
      },
      ONE_DAY
    )
  },

  async getDefiProtocolData(symbol: string) {
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

    // Si no es un protocolo DeFi conocido, retornamos un objeto con valores por defecto
    if (!protocolId) {
      return {
        isDefiProtocol: false,
        tvl: 0,
        chainTvls: {},
        currentChainTvls: {},
        tokens: {}
      }
    }

    try {
      const CACHE_KEY = `defillama-protocol-${protocolId}`
      const ONE_DAY = 86400 // 24 horas

      const data = await getCachedData(
        CACHE_KEY,
        async () => {
          const response = await axios.get(`https://api.llama.fi/protocol/${protocolId}`)
          if (!response.data || response.data === 'Protocol not found') {
            return null
          }
          
          return {
            isDefiProtocol: true,
            tvl: response.data.tvl || 0,
            chainTvls: response.data.chainTvls || {},
            currentChainTvls: response.data.currentChainTvls || {},
            tokens: response.data.tokens || {}
          }
        },
        ONE_DAY
      )

      return data || {
        isDefiProtocol: false,
        tvl: 0,
        chainTvls: {},
        currentChainTvls: {},
        tokens: {}
      }
    } catch (error) {
      console.error('Error fetching DeFi data:', error)
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
