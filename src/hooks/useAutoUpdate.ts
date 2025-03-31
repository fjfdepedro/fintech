'use client'

import { useEffect, useRef } from 'react'
import { checkForUpdates, updateCrypto, updateArticle } from '@/app/actions/update'

const HOUR_IN_MS = 60 * 60 * 1000 // 1 hora en milisegundos
const RETRY_INTERVAL = 5 * 60 * 1000 // 5 minutos en caso de error

export function useAutoUpdate() {
  const lastCryptoUpdateRef = useRef<Date | null>(null)
  const lastArticleUpdateRef = useRef<Date | null>(null)
  const updateInProgressRef = useRef(false)

  const checkAndUpdate = async () => {
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
        console.log('Iniciando actualización de datos crypto...')
        await updateCrypto()
        lastCryptoUpdateRef.current = now
        console.log('Actualización de crypto completada')
      }

      if (needsArticleUpdate) {
        console.log('Iniciando actualización de artículo...')
        await updateArticle()
        lastArticleUpdateRef.current = now
        console.log('Actualización de artículo completada')
      }
    } catch (error) {
      console.error('Error en actualización automática:', error)
      // Reintentar en 5 minutos en caso de error
      setTimeout(checkAndUpdate, RETRY_INTERVAL)
    } finally {
      updateInProgressRef.current = false
    }
  }

  useEffect(() => {
    // Verificar al montar el componente
    checkAndUpdate()

    // Configurar verificación periódica cada 5 minutos
    const interval = setInterval(() => {
      // Solo verificar si el usuario está activo (página visible)
      if (document.visibilityState === 'visible') {
        checkAndUpdate()
      }
    }, 5 * 60 * 1000) // Verificar cada 5 minutos

    // Verificar cuando la página vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
} 