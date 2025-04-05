import { z } from 'zod'
import { CryptoDataSchema, HistoricalDataPointSchema, MarketStatsSchema } from '@/lib/utils/api-validation'

// Tipos inferidos de los esquemas
export type CryptoData = z.infer<typeof CryptoDataSchema>
export type HistoricalDataPoint = z.infer<typeof HistoricalDataPointSchema>
export type MarketStats = z.infer<typeof MarketStatsSchema>

// Tipos de respuesta de API
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  timestamp?: string
  cached?: boolean
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: string
  }
  timestamp: string
}

// Estados de carga y error
export interface LoadingState {
  isLoading: true
  error: null
  data: null
}

export interface ErrorState {
  isLoading: false
  error: Error
  data: null
}

export interface SuccessState<T> {
  isLoading: false
  error: null
  data: T
}

export type ApiState<T> = LoadingState | ErrorState | SuccessState<T>

// Tipos para las respuestas de API
export type CryptoResponse = ApiResponse<CryptoData[]>
export type HistoricalResponse = ApiResponse<HistoricalDataPoint[]>
export type MarketStatsResponse = ApiResponse<MarketStats> 