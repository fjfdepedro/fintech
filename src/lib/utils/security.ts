import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export function validateApiRequest(request: NextRequest): boolean {
  const headersList = headers()
  const origin = headersList.get('origin')
  const referer = headersList.get('referer')
  const host = headersList.get('host')

  // Allowed origins (configurable based on your environment)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost',
    process.env.NEXT_PUBLIC_BASE_URL,
  ].filter(Boolean)

  // Check if the request is from an allowed origin
  const isValidOrigin = origin ? allowedOrigins.includes(origin) : false

  // Check if the referer is from an allowed origin
  const isValidReferer = referer
    ? allowedOrigins.some(allowed => allowed && referer.startsWith(allowed))
    : false

  // For local development, we'll be more permissive
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return isValidOrigin && isValidReferer
}

export function validateSymbol(symbol: string | null): boolean {
  if (!symbol) return false
  
  // Lista de símbolos permitidos
  const allowedSymbols = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'ADA', 'DOT', 'LINK', 'AVAX', 'UNI',
    'ARB', 'OP', 'SUI', 'APT', 'INJ',
    'SEI', 'ALGO', 'FLOKI', 'TON', 'USDT',
    'ATOM', 'XLM', 'DOGE', 'NEAR', 'MATIC',
    'SHIB', 'TRX', 'LTC', 'DAI', 'WBTC',
    'BCH', 'LEO', 'OKB', 'FIL', 'MKR',
    'CRO', 'HBAR', 'VET', 'ICP', 'THETA',
    'SAND', 'MANA', 'AAVE', 'GRT', 'EOS'
  ]

  return allowedSymbols.includes(symbol.toUpperCase())
}

export function validateTimeRange(days: number): boolean {
  // Solo permitimos rangos de tiempo específicos
  const allowedRanges = [1, 7, 14, 30, 90]
  return allowedRanges.includes(days)
} 