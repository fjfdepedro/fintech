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
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Generating market analysis with updated data...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This may take a few seconds while we process the latest information.
        </p>
      </div>
    )
  }

  // Only show content when mounted and not loading
  return (
    <div 
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
} 