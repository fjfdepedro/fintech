'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

interface Article {
  id: string
  content: string
  date: string
  createdAt: string
  updatedAt: string
}

export function CryptoArticle() {
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const response = await fetch('/api/articles')
        if (!response.ok) {
          throw new Error('Failed to fetch article')
        }
        const data = await response.json()
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Crypto Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Crypto Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!article) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Crypto Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <div className="text-sm text-muted-foreground mb-4">
            Last updated: {format(new Date(article.updatedAt), 'PPP')}
          </div>
          <div className="whitespace-pre-wrap">{article.content}</div>
        </div>
      </CardContent>
    </Card>
  )
} 