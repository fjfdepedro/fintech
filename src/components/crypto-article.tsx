'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

export function CryptoArticle() {
  const [article, setArticle] = useState<{ content: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get('/api/articles')
        setArticle(response.data)
      } catch (error) {
        console.error('Error fetching article:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [])

  if (loading) {
    return <div>Loading article...</div>
  }

  if (!article) {
    return <div>No article available</div>
  }

  return (
    <div 
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: article.content }}
    />
  )
} 