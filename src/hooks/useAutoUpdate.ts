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

  const performUpdate = useCallback(async (updateFn: () => Promise<any>, type: 'crypto' | 'article') => {
    try {
      await updateFn()
      if (type === 'crypto') {
        lastCryptoUpdateRef.current = new Date()
      } else {
        lastArticleUpdateRef.current = new Date()
      }
      retryCountRef.current = 0 // Reset retry count on success
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      throw error
    }
  }, [])

  useEffect(() => {
    const checkAndUpdate = async () => {
      if (updateInProgressRef.current) return
      updateInProgressRef.current = true

      try {
        const { needsUpdate } = await checkForUpdates()

        if (needsUpdate) {
          await performUpdate(updateCrypto, 'crypto')
          await performUpdate(updateArticle, 'article')
        }
      } catch (error) {
        console.error('Error in update cycle:', error)
        retryCountRef.current++

        if (retryCountRef.current < MAX_RETRIES) {
          // Programar reintento
          setTimeout(checkAndUpdate, RETRY_INTERVAL)
        } else {
          console.error('Max retries reached, giving up until next cycle')
          retryCountRef.current = 0
        }
      } finally {
        updateInProgressRef.current = false
      }
    }

    // Iniciar el ciclo de actualización
    const interval = setInterval(checkAndUpdate, HOUR_IN_MS)
    checkAndUpdate() // Ejecutar inmediatamente al montar

    return () => clearInterval(interval)
  }, [performUpdate])
} 