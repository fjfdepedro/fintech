import { NextResponse } from 'next/server'

type CacheOptions = {
  revalidate?: number
  tags?: string[]
  staleWhileRevalidate?: number
  isDynamic?: boolean
}

export function createCachedResponse(
  data: any,
  options: CacheOptions = {}
) {
  const {
    revalidate = 3600,
    tags = [],
    staleWhileRevalidate = 59,
    isDynamic = false
  } = options

  const headers = new Headers()
  
  // Configurar Cache-Control con optimizaciones para CWV
  if (isDynamic) {
    // Para contenido dinámico, usar stale-while-revalidate
    headers.set(
      'Cache-Control',
      `public, s-maxage=${revalidate}, stale-while-revalidate=${staleWhileRevalidate}`
    )
  } else {
    // Para contenido estático, usar max-age más largo
    headers.set(
      'Cache-Control',
      `public, max-age=${revalidate}, immutable`
    )
  }

  // Añadir tags para revalidación específica
  if (tags.length > 0) {
    headers.set('x-cache-tags', tags.join(','))
  }

  // Añadir timestamp de generación
  headers.set('x-cache-timestamp', new Date().toISOString())

  // Headers adicionales para optimizar CWV
  headers.set('Vary', 'Accept-Encoding')
  headers.set('X-Content-Type-Options', 'nosniff')

  return NextResponse.json(data, { headers })
}

export function createErrorResponse(
  error: Error | string,
  status: number = 500
) {
  const message = error instanceof Error ? error.message : error
  
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  )
} 