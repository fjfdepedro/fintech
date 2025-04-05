import { z } from 'zod'

// Esquemas de validación
export const CryptoDataSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  volume: z.number(),
  market_cap: z.number().optional(),
  type: z.literal('CRYPTO')
})

export const HistoricalDataPointSchema = z.object({
  timestamp: z.string(),
  price: z.number(),
  volume: z.string()
})

export const MarketStatsSchema = z.object({
  total_market_cap: z.number(),
  total_volume: z.number(),
  btc_dominance: z.number(),
  eth_dominance: z.number()
})

// Tipos de error
export interface ApiError {
  code: string
  message: string
  details?: string
}

// Función para validar respuestas de API
export function validateApiResponse<T>(data: unknown, schema: z.ZodType<T>) {
  try {
    const validatedData = schema.parse(data)
    return { success: true as const, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data format',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        }
      }
    }
    return {
      success: false as const,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : undefined
      }
    }
  }
}

// Función para crear errores de API
export function createApiError(code: string, message: string, details?: string): ApiError {
  return {
    code,
    message,
    details
  }
} 