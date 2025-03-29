"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/widgets/metric-card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { useCryptoData } from "@/hooks/useCrypto"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from 'date-fns'
import axios from "axios"
import { CryptoArticle } from "../components/crypto-article"

interface HistoricalData {
  coinId: string
  symbol: string
  data: { date: Date; value: number }[]
}

export default function Home() {
  const { data: cryptoData, loading: cryptoLoading, lastUpdated } = useCryptoData()
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!cryptoData?.length) return

    const fetchHistoricalData = async () => {
      try {
        setHistoryLoading(true)
        
        const promises = cryptoData.map(async coin => {
          try {
            const response = await axios.get(`/api/crypto/history?symbol=${coin.symbol}&days=7`)
            const historicalData = response.data
            
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
        setHistoricalData(validResults)
      } catch (error) {
        console.error('Error obteniendo datos históricos:', error)
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistoricalData()
  }, [cryptoData])

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <div className="flex items-center gap-3 px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M12 2v20M2 12h20M7 17l5-5 5 5M7 7l5 5 5-5" />
            </svg>
            <span className="font-bold">
              Crypto Market Insights
            </span>
          </div>
        }
      />
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Daily Crypto Analysis</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Last Update: {lastUpdated ? format(new Date(lastUpdated), 'MMMM d, yyyy') + ' at ' + format(new Date(lastUpdated), 'HH:mm') + ' GMT' : '--'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-2
                    prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-6 prose-h2:border-b prose-h2:pb-2
                    prose-h3:text-xl prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-4
                    prose-h4:text-lg prose-h4:font-medium prose-h4:mt-6 prose-h4:mb-3
                    prose-p:my-4 prose-p:leading-relaxed
                    prose-strong:font-semibold
                    prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                    prose-li:my-2
                    prose-hr:my-8 prose-hr:border-t prose-hr:border-muted/60
                    [&_hr+h3]:mt-8 [&_hr+p]:mt-8 [&_p+hr]:mt-8 [&_ul+hr]:mt-8 [&_table+hr]:mt-8
                    [&_.date]:text-lg [&_.date]:font-medium [&_.date]:mb-6 [&_.date]:text-foreground/80
                    [&_.time-value]:text-muted-foreground
                    [&_.subtitle]:text-base [&_.subtitle]:text-muted-foreground [&_.subtitle]:mb-8
                    [&_.section-number]:font-bold [&_.section-number]:mr-2
                    [&_.performance]:font-medium [&_.performance]:text-muted-foreground
                    [&_.category-title]:text-lg [&_.category-title]:font-semibold [&_.category-title]:mt-6 [&_.category-title]:mb-2
                  ">
                    <CryptoArticle />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top Cryptocurrencies</CardTitle>
              </CardHeader>
              <CardContent>
                {cryptoLoading ? (
                  <Skeleton className="h-[600px]" />
                ) : (
                  <MarketTable 
                    data={(cryptoData || [])
                      .map(item => ({
                        ...item,
                        name: item.name || 'Unknown',
                        volume: item.volume || '0'
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name))
                    }
                    loading={cryptoLoading}
                    type="crypto"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cryptocurrency Price Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {historyLoading ? (
                Array(25).fill(0).map((_, i) => (
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
                historicalData
                  .sort((a, b) => {
                    const nameA = cryptoData.find(c => c.id === a.coinId)?.name || '';
                    const nameB = cryptoData.find(c => c.id === b.coinId)?.name || '';
                    return nameA.localeCompare(nameB);
                  })
                  .map((coin) => {
                    const cryptoInfo = cryptoData.find(c => c.id === coin.coinId)
                    return (
                      <Card key={coin.coinId} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="p-4 bg-muted/50">
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
                          <div className="p-4 text-sm text-muted-foreground border-t">
                            <div className="font-medium">{cryptoInfo?.name || 'Cryptocurrency'}</div>
                            <div className="mt-1">Price: ${cryptoInfo?.price.toFixed(2) || '--'}</div>
                            <div className="text-xs mt-1">
                              {cryptoInfo?.timestamp ? format(new Date(cryptoInfo.timestamp), 'MMM dd, yyyy HH:mm') + ' GMT' : '--'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
