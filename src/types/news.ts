export interface NewsArticle {
  title: string
  description: string | null
  pubDate: string
  source_name: string
  duplicate?: boolean
} 