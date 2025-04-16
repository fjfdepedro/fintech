import { Prisma } from '@prisma/client'

export interface MessariMetricsRecord {
  id: string
  symbol: string
  data: {
    market_data: {
      volume_last_24h: number | null
      real_volume_last_24h: number | null
    }
    roi_data: {
      percent_change_last_1_week: number | null
      percent_change_last_1_month: number | null
    }
    mining_stats: any
    developer_activity: any
    supply: {
      liquid: number | null
      circulating: number | null
      total: number | null
    }
  }
  timestamp: Date
  updated_at: Date
}

export interface DefiProtocolDataRecord {
  id: string
  symbol: string
  data: {
    isDefiProtocol: boolean
    tvl: number
    chainTvls: Record<string, number>
    currentChainTvls: Record<string, number>
    tokens: Record<string, any>
  }
  timestamp: Date
  updated_at: Date
}

// Helper type para $queryRaw
export type RawQueryResult<T> = T extends Array<infer U> ? U[] : T 