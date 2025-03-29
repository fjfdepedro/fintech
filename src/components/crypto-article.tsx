'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

export function CryptoArticle({ content }: { content: string }) {
  return (
    <div 
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
} 