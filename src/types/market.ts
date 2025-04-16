import type { MarketData } from '@prisma/client'

export type NonNullableMarketData = {
  symbol: string
  name: string
  id: string
  price: number
  change: number
  volume: string
  market_cap: number
  type: string
  timestamp: Date
}

export const ensureNonNullable = (data: MarketData): NonNullableMarketData => ({
  ...data,
  name: data.name || data.symbol,
  volume: data.volume || '0',
  type: 'CRYPTO'
} as NonNullableMarketData) 