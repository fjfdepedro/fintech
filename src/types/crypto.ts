export interface MarketData {
  id: string
  name: string
  symbol: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
  timestamp: Date
}

export interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  volume: string
  market_cap: number
  timestamp: Date
  type: string
  high_24h?: number
  low_24h?: number
  total_supply?: number
  circulating_supply?: number
}

export interface HistoricalDataPoint {
  date: Date
  value: number
}

export interface HistoricalCryptoData {
  coinId: string
  symbol: string
  data: HistoricalDataPoint[]
} 