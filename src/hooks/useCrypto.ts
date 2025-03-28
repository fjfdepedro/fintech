"use client"

import { useState, useEffect } from 'react'
import { cryptoAPI } from '@/lib/api/crypto-service'
import type { MarketData } from '@/types/prisma'
import axios from 'axios'

export function useCryptoData() {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Primero obtener datos de la base de datos
        const dbData = await axios.get('/api/crypto?limit=25')
        setData(dbData.data)
        setLastUpdated(new Date(dbData.data[0]?.timestamp))
        setError(null)

        // 2. Verificar si necesitamos actualizar desde CoinGecko (cada hora)
        const lastUpdate = await axios.get('/api/crypto/last-update')
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        if (!lastUpdate.data.lastUpdate || new Date(lastUpdate.data.lastUpdate) < oneHourAgo) {
          // 3. Si necesitamos actualizar, hacerlo en segundo plano
          const apiData = await cryptoAPI.getTopCryptos(25)
          await Promise.all(apiData.map(data => axios.post('/api/crypto', data)))
          setData(apiData)
          setLastUpdated(new Date())
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Actualizar cada hora
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error, lastUpdated }
}
