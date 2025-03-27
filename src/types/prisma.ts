export interface MarketData {
  id: string
  symbol: string
  name: string | null
  price: number
  change: number
  volume: string | null
  type: string
  timestamp: Date
  market_cap: number
}

export interface ApiLimit {
  id: string
  apiName: string
  dailyLimit: number
  requestCount: number
  lastReset: Date
}
