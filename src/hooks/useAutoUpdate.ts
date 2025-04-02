'use client'

import { useEffect, useRef, useCallback } from 'react'
import { checkForUpdates, updateCrypto, updateArticle } from '@/app/actions/update'

const HOUR_IN_MS = 60 * 60 * 1000 // 1 hora en milisegundos
const RETRY_INTERVAL = 5 * 60 * 1000 // 5 minutos en caso de error
const MAX_RETRIES = 3

export function useAutoUpdate() {
  const lastCryptoUpdateRef = useRef<Date | null>(null)
  const lastArticleUpdateRef = useRef<Date | null>(null)
  const updateInProgressRef = useRef(false)
  const retryCountRef = useRef(0)

  const revalidateCache = useCallback(async (path: string) => {
    try {
      // Usar la ruta API que maneja la revalidación
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
        },
        body: JSON.stringify({ path }),
      })

      if (!response.ok) {
        throw new Error(`Failed to revalidate path: ${path}`)
      }

      return response.json()
    } catch (error) {
      console.error('Error revalidating cache:', error)
      throw error
    }
  }, [])

  const performUpdate = useCallback(async (updateFn: () => Promise<any>, type: 'crypto' | 'article') => {
    try {
      await updateFn()
      if (type === 'crypto') {
        lastCryptoUpdateRef.current = new Date()
        // Revalidar cache de la página principal y rutas relacionadas
        await Promise.all([
          revalidateCache('/'),
          revalidateCache('/api/crypto'),
          revalidateCache('/api/crypto/history')
        ])
      } else {
        lastArticleUpdateRef.current = new Date()
        // Revalidar cache de la página de artículos
        await revalidateCache('/api/articles')
      }
      retryCountRef.current = 0 // Reset retry count on success
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      throw error
    }
  }, [revalidateCache])

  const checkAndUpdate = useCallback(async () => {
    if (updateInProgressRef.current) return
    updateInProgressRef.current = true

    try {
      const updateStatus = await checkForUpdates()
      const now = new Date()
      
      // Verificar actualización de crypto
      const lastCryptoUpdate = updateStatus.lastUpdate ? new Date(updateStatus.lastUpdate) : null
      const needsCryptoUpdate = !lastCryptoUpdate || 
        (now.getTime() - lastCryptoUpdate.getTime()) > HOUR_IN_MS

      // Verificar actualización de artículo
      const needsArticleUpdate = !lastArticleUpdateRef.current || 
        (now.getTime() - lastArticleUpdateRef.current.getTime()) > HOUR_IN_MS

      if (needsCryptoUpdate) {
        await performUpdate(updateCrypto, 'crypto')
      }

      if (needsArticleUpdate) {
        await performUpdate(updateArticle, 'article')
      }
    } catch (error) {
      console.error('Error en actualización automática:', error)
      retryCountRef.current++
      
      if (retryCountRef.current < MAX_RETRIES) {
        // Reintentar en 5 minutos en caso de error
        setTimeout(checkAndUpdate, RETRY_INTERVAL)
      } else {
        console.error('Max retries reached, will try again in an hour')
        retryCountRef.current = 0
      }
    } finally {
      updateInProgressRef.current = false
    }
  }, [performUpdate])

  useEffect(() => {
    // Ejecutar inmediatamente al montar
    checkAndUpdate()

    // Configurar intervalo para ejecutar cada hora
    const interval = setInterval(checkAndUpdate, HOUR_IN_MS)

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval)
  }, [checkAndUpdate])

  return null
} 