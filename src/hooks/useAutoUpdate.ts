'use client'

import { useEffect, useRef, useCallback } from 'react'
import { checkForUpdates, updateCrypto, updateArticle } from '@/app/actions/update'

const HOUR_IN_MS = 60 * 60 * 1000 // 1 hora en milisegundos
const RETRY_INTERVAL = 5 * 60 * 1000 // 5 minutos en caso de error

export function useAutoUpdate() {
  const lastCryptoUpdateRef = useRef<Date | null>(null)
  const lastArticleUpdateRef = useRef<Date | null>(null)
  const updateInProgressRef = useRef(false)

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
        await updateCrypto()
        lastCryptoUpdateRef.current = now
      }

      if (needsArticleUpdate) {
        await updateArticle()
        lastArticleUpdateRef.current = now
      }
    } catch (error) {
      console.error('Error en actualización automática:', error)
      // Reintentar en 5 minutos en caso de error
      setTimeout(checkAndUpdate, RETRY_INTERVAL)
    } finally {
      updateInProgressRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const performUpdate = async () => {
      if (!mounted) return
      await checkAndUpdate()
    }

    // Verificar al montar el componente
    performUpdate()

    // Configurar verificación periódica cada 5 minutos
    const interval = setInterval(() => {
      // Solo verificar si el usuario está activo (página visible)
      if (document.visibilityState === 'visible' && mounted) {
        performUpdate()
      }
    }, 5 * 60 * 1000) // Verificar cada 5 minutos

    // Verificar cuando la página vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        performUpdate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkAndUpdate])

  return null
} 