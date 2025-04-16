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

export interface SocialMetrics {
  twitter_followers: number
  reddit_subscribers: number
  telegram_channel_user_count: number
  github_stats?: {
    stars: number
    forks: number
    subscribers: number
    total_issues: number
    closed_issues: number
    pull_requests_merged: number
    pull_request_contributors: number
    code_additions_deletions_4_weeks: {
      additions: number
      deletions: number
    }
    commit_count_4_weeks: number
  }
  last_commit?: number[]
}

export interface DefiTokenData {
  tvl: number;
  [key: string]: any;
}

export interface DefiData {
  isDefiProtocol: boolean
  tvl: number
  chainTvls: Record<string, number>
  currentChainTvls: Record<string, number>
  tokens: Record<string, DefiTokenData>
}

export interface OnChainMetrics {
  active_addresses: number
  transaction_count: number
  transaction_volume: number
  average_transaction_value: number
  mining_difficulty?: number
  hash_rate?: number
  block_time?: number
  block_size?: number
  block_count?: number
}

export interface SentimentData {
  sentiment_votes_up_percentage: number
  sentiment_votes_down_percentage: number
  market_cap_rank: number
  coingecko_rank: number
  coingecko_score: number
  developer_score: number
  community_score: number
  liquidity_score: number
  public_interest_score: number
}

export interface CryptoDetailedData extends CryptoData {
  social_metrics?: SocialMetrics
  defi_data?: DefiData
  on_chain_metrics?: OnChainMetrics
  sentiment?: SentimentData
  description?: {
    en: string
  }
  links?: {
    homepage: string[]
    blockchain_site: string[]
    official_forum_url: string[]
    chat_url: string[]
    announcement_url: string[]
    twitter_screen_name: string
    facebook_username: string
    telegram_channel_identifier: string
    subreddit_url: string
  }
  image?: {
    thumb: string
    small: string
    large: string
  }
  categories?: string[]
  genesis_date?: string
  market_data?: {
    ath: { [key: string]: number }
    ath_date: { [key: string]: string }
    atl: { [key: string]: number }
    atl_date: { [key: string]: string }
    roi?: {
      times: number
      currency: string
      percentage: number
    }
  }
} 