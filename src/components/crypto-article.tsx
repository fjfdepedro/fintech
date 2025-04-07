'use client'

import { useEffect, useState } from 'react'

export function CryptoArticle({ content }: { content: string }) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Simulate loading time to show the indicator
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // 2 seconds loading time
    
    return () => clearTimeout(timer)
  }, [])

  // Show loading state by default
  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-sm font-medium text-muted-foreground text-center">
          Loading market analysis...
        </p>
      </div>
    )
  }

  // Only show content when mounted and not loading
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  )
} 