'use client'

import { useEffect, useState } from 'react'

export function CryptoArticle({ content }: { content: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className="prose prose-slate dark:prose-invert max-w-none"
        suppressHydrationWarning
      >
        {content}
      </div>
    )
  }

  return (
    <div 
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
} 