"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/widgets/metric-card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { useCryptoData } from "@/hooks/useCrypto"
import { useState, useEffect } from "react"
import { cryptoAPI } from "@/lib/api/crypto-service"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from 'date-fns'
import type { marketData } from '.prisma/client' // Asegúrate de que este import sea correcto
import axios from "axios"
import { CryptoArticle } from "../components/crypto-article"

const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutos en milisegundos

interface HistoricalData {
  coinId: string
  symbol: string
  data: { date: Date; value: number }[]
}

const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) return '0.00%'
  const change = ((current - previous) / previous) * 100
  return `${change.toFixed(2)}%`
}

const calculateBTCDominance = (btcMarketCap: number, totalMarketCap: number): string => {
  if (totalMarketCap === 0) return '0.00%'
  const dominance = (btcMarketCap / totalMarketCap) * 100
  return `${dominance.toFixed(2)}%`
}

export default function Home() {
  const { data: cryptoData, loading: cryptoLoading, lastUpdated } = useCryptoData()
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<marketData[]>([])

  // Calcular valores dinámicos
  const globalMarketCap = cryptoData?.[0]?.market_cap || 0
  const previousGlobalMarketCap = 0 // Aquí deberías obtener el valor anterior desde la API o la base de datos
  const globalMarketCapChange = calculateChange(globalMarketCap, previousGlobalMarketCap)

  const volume24h = cryptoData?.[0]?.volume || 0
  const previousVolume24h = 0 // Aquí deberías obtener el valor anterior desde la API o la base de datos
  const volume24hChange = calculateChange(Number(volume24h), previousVolume24h)

  const btcMarketCap = cryptoData?.find(c => c.symbol === 'BTC')?.market_cap || 0
  const btcDominance = calculateBTCDominance(btcMarketCap, globalMarketCap)
  const previousBTCDominance = 0 // Aquí deberías obtener el valor anterior desde la API o la base de datos
  const btcDominanceChange = calculateChange(parseFloat(btcDominance), previousBTCDominance)

  const activeCryptos = cryptoData?.length || 0
  const previousActiveCryptos = 0 // Aquí deberías obtener el valor anterior desde la API o la base de datos
  const activeCryptosChange = calculateChange(activeCryptos, previousActiveCryptos)

  useEffect(() => {
    if (!cryptoData?.length) return

    const fetchHistoricalData = async () => {
      try {
        console.log('Iniciando fetch de datos históricos...')
        setHistoryLoading(true)
        
        const promises = cryptoData.map(async coin => {
          try {
            console.log(`Obteniendo datos históricos para ${coin.symbol}...`)
            const response = await axios.get(`/api/crypto/history?symbol=${coin.symbol}&days=7`)
            const historicalData = response.data

            console.log(`Datos históricos para ${coin.symbol}:`, historicalData)
            
            return {
              coinId: coin.id,
              symbol: coin.symbol,
              data: historicalData
            }
          } catch (error) {
            console.error(`Error obteniendo datos históricos para ${coin.symbol}:`, error)
            return null
          }
        })

        const results = await Promise.all(promises)
        const validResults = results.filter(result => result !== null)
        console.log('Datos históricos obtenidos:', validResults)
        setHistoricalData(validResults)
      } catch (error) {
        console.error('Error obteniendo datos históricos:', error)
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistoricalData()
  }, [cryptoData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Iniciando fetch de datos...')
        
        // Obtener datos de la API
        const apiData = await cryptoAPI.getTopCryptos(20)
        console.log('Datos de API obtenidos:', apiData)
        
        setData(apiData)
        setError(null)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Crypto Dashboard"
        text={`Last update: ${lastUpdated ? format(lastUpdated, 'MM/dd/yyyy HH:mm') : 'Loading...'}`}
      />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Global Market Cap"
            value={globalMarketCap ? `$${(globalMarketCap / 1e12).toFixed(2)}T` : '$--'}
            change={globalMarketCapChange}
            changeType={parseFloat(globalMarketCapChange) >= 0 ? 'increase' : 'decrease'}
          />
          <MetricCard
            title="24h Volume"
            value={volume24h ? `$${(Number(volume24h) / 1e9).toFixed(2)}B` : '$--'}
            change={volume24hChange}
            changeType={parseFloat(volume24hChange) >= 0 ? 'increase' : 'decrease'}
          />
          <MetricCard
            title="BTC Dominance"
            value={btcDominance}
            change={btcDominanceChange}
            changeType={parseFloat(btcDominanceChange) >= 0 ? 'increase' : 'decrease'}
          />
          <MetricCard
            title="Active Cryptocurrencies"
            value={activeCryptos.toString()}
            change={activeCryptosChange}
            changeType={parseFloat(activeCryptosChange) >= 0 ? 'increase' : 'decrease'}
          />
        </div>
        
        <CryptoArticle />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Top Cryptocurrencies</CardTitle>
            </CardHeader>
            <CardContent>
              {cryptoLoading ? (
                <Skeleton className="h-[400px]" />
              ) : (
                <MarketTable 
                  data={(cryptoData || []).map(item => ({
                    ...item,
                    name: item.name || 'Unknown',
                    volume: item.volume || '0'
                  }))}
                  loading={cryptoLoading}
                  type="crypto"
                />
              )}
            </CardContent>
          </Card>
          
          {historyLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="p-0">
                  <Skeleton className="h-[200px]" />
                </CardContent>
              </Card>
            ))
          ) : (
            historicalData.map((coin) => {
              const cryptoInfo = cryptoData.find(c => c.id === coin.coinId)
              return (
                <Card key={coin.coinId} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium">
                      {coin.symbol} Price (7d)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PriceChart
                      data={coin.data}
                      symbol={coin.symbol}
                      showAxes={false}
                      height={200}
                    />
                    <div className="p-4 text-sm text-muted-foreground">
                      <div>{cryptoInfo?.name || 'Cryptocurrency'} - Current price: ${cryptoInfo?.price.toFixed(2) || '--'}</div>
                      <div>Last update: {cryptoInfo?.timestamp ? format(new Date(cryptoInfo.timestamp), 'MM/dd/yyyy HH:mm') : '--'}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
