"use client"

import { useState, useEffect } from 'react'
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
        console.log('=== INICIO DE FETCH DATA ===')
        setLoading(true)
        
        // 1. Forzar actualización inicial
        console.log('Forzando actualización inicial...')
        const updateResponse = await axios.get('/api/crypto/update')
        console.log('Respuesta de actualización:', updateResponse.data)
        
        // 2. Obtener datos actualizados
        console.log('Obteniendo datos actualizados...')
        const updatedData = await axios.get('/api/crypto')
        console.log('Datos recibidos:', updatedData.data.length, 'registros')
        
        if (updatedData.data.length > 0) {
          setData(updatedData.data)
          setLastUpdated(new Date(updatedData.data[0]?.timestamp))
          console.log('Última actualización:', updatedData.data[0]?.timestamp)
        } else {
          console.log('No se recibieron datos')
        }
        
        // 3. Verificar estado de actualización
        const { data: updateStatus } = await axios.get('/api/crypto/last-update')
        console.log('Estado de actualización:', updateStatus)
        
      } catch (err) {
        console.error('Error en fetchData:', err)
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        setLoading(false)
        console.log('=== FIN DE FETCH DATA ===')
      }
    }

    // Ejecutar inmediatamente
    fetchData()
    
    // Configurar intervalo para actualizaciones posteriores
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error, lastUpdated }
}
