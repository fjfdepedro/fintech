"use client"

import { useState, useEffect } from 'react'
import { cryptoAPI } from '@/lib/api/crypto-service'
import type { MarketData } from '@/types/prisma'
import axios from 'axios'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export function useCryptoData() {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Obtener datos de la base de datos
        const dbData = await axios.get('/api/crypto?limit=25')
        setData(dbData.data)
        setLastUpdated(new Date(dbData.data[0]?.timestamp))
        setError(null)

        // 2. Verificar si necesitamos actualizar
        const { data: updateStatus } = await axios.get('/api/crypto/last-update')
        
        if (updateStatus.needsUpdate) {
          // 3. Solicitar actualización al servidor
          await axios.get('/api/crypto/update')
          // 4. Obtener los datos actualizados
          const updatedData = await axios.get('/api/crypto?limit=25')
          setData(updatedData.data)
          setLastUpdated(new Date(updatedData.data[0]?.timestamp))
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

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 1. Obtener nuevos datos de CoinGecko
    const apiData = await cryptoAPI.getTopCryptos(25)
    
    // 2. Obtener el inicio y fin de la hora actual
    const now = new Date()
    const startOfHour = new Date(now.setMinutes(0, 0, 0))
    const endOfHour = new Date(now.setTime(now.getTime() + 60 * 60 * 1000 - 1))

    // 3. Eliminar datos antiguos de la misma hora
    await prisma.marketData.deleteMany({
      where: {
        timestamp: {
          gte: startOfHour,
          lte: endOfHour
        }
      }
    })
    
    // 4. Guardar los nuevos datos
    await Promise.all(apiData.map(data => 
      prisma.marketData.create({
        data: {
          ...data,
          timestamp: new Date()
        }
      })
    ))

    return NextResponse.json({ 
      message: 'Data updated successfully',
      lastUpdate: new Date(),
      count: apiData.length
    })
  } catch (error) {
    console.error('Error updating crypto data:', error)
    return NextResponse.json(
      { error: 'Failed to update crypto data' },
      { status: 500 }
    )
  }
}
