import axios from 'axios'
import { specificCoins } from './crypto-service'

const COINMARKETCAP_API_URL = 'https://pro-api.coinmarketcap.com/v2'
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

// Configurar headers por defecto para todas las llamadas a CoinMarketCap
const coinmarketcapAxios = axios.create({
  baseURL: COINMARKETCAP_API_URL,
  headers: {
    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY || '',
    'Accept': 'application/json'
  }
})

// Mapeo de IDs a símbolos
export const symbolMap: { [key: string]: string } = {
  // Top Tier
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'ripple': 'XRP',
  'tether': 'USDT',
  'usd-coin': 'USDC',
  'cardano': 'ADA',
  'dogecoin': 'DOGE',
  'polkadot': 'DOT',
  'solana': 'SOL',
  'avalanche-2': 'AVAX',
  'chainlink': 'LINK',
  'uniswap': 'UNI',
  'stellar': 'XLM',
  'cosmos': 'ATOM',
  'near': 'NEAR',
  'aptos': 'APT',
  'sui': 'SUI',
  'the-open-network': 'TON',
  'tron': 'TRX',
  'wrapped-bitcoin': 'WBTC',
  'wrapped-steth': 'WSTETH',
  'leo-token': 'LEO',
  'lido-staked-ether': 'STETH',
  'shiba-inu': 'SHIB',
  
  // Mid Tier
  'polygon': 'MATIC',
  'monero': 'XMR',
  'bitcoin-cash': 'BCH',
  'litecoin': 'LTC',
  'dai': 'DAI',
  'ethereum-classic': 'ETC',
  'hedera-hashgraph': 'HBAR',
  'filecoin': 'FIL',
  'internet-computer': 'ICP',
  'arbitrum': 'ARB',
  'optimism': 'OP',
  'cronos': 'CRO',
  'algorand': 'ALGO',
  'vechain': 'VET',
  'aave': 'AAVE',
  'eos': 'EOS',
  'tezos': 'XTZ',
  'quant-network': 'QNT',
  'elrond-erd-2': 'EGLD',
  'pax-gold': 'PAXG',
  'theta-token': 'THETA',
  'fantom': 'FTM',
  'thorchain': 'RUNE',
  'pancakeswap-token': 'CAKE',
  'curve-dao-token': 'CRV',
  
  // Nuevas Adiciones
  'render': 'RNDR',
  'sei-network': 'SEI',
  'floki': 'FLOKI',
  'dogwifhat': 'WIF',
  'hyperliquid': 'HYPE',
  'ondo': 'ONDO',
  'berachain': 'BERA',
  'story-protocol': 'IP',
  'solaxy': 'SOLX',
  'qubetics': 'TICS'
}

export const coinmarketcapAPI = {
  async getMetadata() {
    try {
      const response = await coinmarketcapAxios.get('/cryptocurrency/info', {
        params: {
          symbol: Object.values(symbolMap).join(',')
        }
      })

      return response.data.data
    } catch (error) {
      console.error('Error fetching metadata from CoinMarketCap:', error)
      throw error
    }
  },
  
  async getCryptoMetadata(coinId: string) {
    try {
      const response = await coinmarketcapAxios.get('/cryptocurrency/info', {
        params: {
          id: coinId
        }
      })

      return response.data.data[coinId]
    } catch (error) {
      console.error(`Error fetching metadata for ${coinId} from CoinMarketCap:`, error)
      return null
    }
  }
} 