import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { format } from 'date-fns'
import { CryptoArticle } from "../components/crypto-article"
import { Header } from "@/components/header"
import { checkAndUpdateCryptoData, getLatestCryptoData } from "@/lib/services/crypto-service"
import { checkAndUpdateArticle, getLatestArticle } from "@/lib/services/article-service"
import prisma from '@/lib/prisma'
import Script from 'next/script'
import { CryptoData, HistoricalDataPoint, HistoricalCryptoData } from "@/types/crypto"
import { formatDate, isValidPastDate } from "@/lib/utils/date"
import { ImageGallery } from '@/components/ui/image-gallery'
import Image from 'next/image'
import { SiteFooter } from "@/components/site-footer"
import { cache } from 'react'

// Force static generation with ISR
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

async function getCryptoData(): Promise<CryptoData[]> {
  try {
    // During build, only get data from database
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return getLatestCryptoData()
    }

    // During runtime, check and update if needed
    const updateResult = await checkAndUpdateCryptoData()
    if (!updateResult.updated && updateResult.error) {
      console.warn('Failed to update crypto data:', updateResult.error)
    }
    
    const data = await getLatestCryptoData()
    if (!data || data.length === 0) {
      console.error('No crypto data available')
      throw new Error('No crypto data available')
    }
    
    return data
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    // Return an empty array but with a special flag to indicate error
    return []
  }
}

// Function to get latest article and update if needed
async function getArticle() {
  // During build, only get data from database
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return getLatestArticle()
  }

  // During runtime, check and update if needed
  await checkAndUpdateArticle()
  return getLatestArticle()
}

// ✅ Cache crypto metadata to avoid duplicate queries
const getCryptoMetadata = cache(async () => {
  return prisma.cryptoMarketMetadata.findMany({
    select: {
      symbol: true,
      logo_url: true
    }
  })
})

export default async function Home() {
  try {
    // Use Next.js fetch with cache
    const [cryptoData, article, cryptoMetadata] = await Promise.all([
      getCryptoData(),
      getArticle(),
      getCryptoMetadata()
    ])

    if (!cryptoData || cryptoData.length === 0) {
      return (
        <div className="container mx-auto p-6">
          <Header />
          <div className="mt-6">
            <Card>
              <CardHeader className="p-6">
                <CardTitle className="text-2xl font-bold text-red-600">
                  Temporarily Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  We are currently experiencing high traffic and have reached our API rate limit. 
                  Please try again in a few minutes. Our system will automatically refresh the data 
                  once the rate limit resets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
    
    // Cache the response at the edge
    const response = new Response(JSON.stringify({ cryptoData, article, cryptoMetadata }), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    })

    const lastUpdated = cryptoData[0]?.timestamp

    // Create a map of symbol to logo URL
    const logoMap = cryptoMetadata.reduce((acc, item) => {
      acc[item.symbol] = item.logo_url
      return acc
    }, {} as Record<string, string | null>)

    // Obtener todos los símbolos únicos
    const symbols = cryptoData.map((coin: CryptoData) => coin.symbol)

    async function getHistoricalData(symbols: string[], cryptoData: CryptoData[]): Promise<HistoricalCryptoData[]> {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // Calculate max records per symbol to stay under 5MB limit
      // With ~20-30 symbols, limit to ~30-40 records per symbol = ~600-1200 total records
      const maxRecordsPerSymbol = Math.max(20, Math.floor(1000 / symbols.length))

      // ✅ FIXED: Single query with IN instead of 67 individual queries
      const historicalData = await prisma.marketData.findMany({
        where: {
          symbol: {
            in: symbols.map(s => s.toUpperCase())
          },
          timestamp: {
            gte: startDate
          }
        },
        orderBy: [
          { symbol: 'asc' },
          { timestamp: 'asc' }
        ],
        select: {
          symbol: true,
          price: true,
          timestamp: true
        },
        // Take total records and distribute evenly
        take: maxRecordsPerSymbol * symbols.length
      })

      // Agrupar los datos por símbolo y limitar por símbolo
      const groupedData = historicalData.reduce((acc, record) => {
        if (!acc[record.symbol]) {
          acc[record.symbol] = []
        }
        // Limit records per symbol during grouping
        if (acc[record.symbol].length < maxRecordsPerSymbol) {
          acc[record.symbol].push({
            date: record.timestamp,
            value: record.price
          })
        }
        return acc
      }, {} as Record<string, HistoricalDataPoint[]>)

      // Convertir a formato HistoricalCryptoData
      return symbols.map(symbol => ({
        coinId: cryptoData.find((c: CryptoData) => c.symbol === symbol.toUpperCase())?.id || symbol,
        symbol: symbol.toUpperCase(),
        data: groupedData[symbol.toUpperCase()] || []
      }))
    }

    // Fetch historical data for all cryptos in a single query
    const historicalData = await getHistoricalData(symbols, cryptoData)

    // Prepare structured data for the page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Crypto Market Insights",
      "description": "Real-time crypto market analysis and price tracking",
      "dateModified": lastUpdated ? new Date(lastUpdated).toISOString() : new Date().toISOString(),
      "mainEntity": {
        "@type": "DataFeed",
        "dataFeedElement": cryptoData.map((coin: CryptoData) => ({
          "@type": "DataFeedItem",
          "item": {
            "@type": "FinancialProduct",
            "name": coin.name,
            "tickerSymbol": coin.symbol,
            "price": coin.price,
            "priceCurrency": "USD",
            "dateModified": new Date(coin.timestamp).toISOString()
          }
        }))
      }
    }

    // Ensure consistent date formatting with correct timezone
    const formattedLastUpdated = lastUpdated && isValidPastDate(lastUpdated)
      ? formatDate(lastUpdated)
      : '--'

    // Sort historical data consistently
    const sortedHistoricalData = [...historicalData].sort((a: HistoricalCryptoData, b: HistoricalCryptoData) => {
      const nameA = cryptoData.find((c: CryptoData) => c.id === a.coinId)?.name || '';
      const nameB = cryptoData.find((c: CryptoData) => c.id === b.coinId)?.name || '';
      return nameA.localeCompare(nameB);
    })

    return (
      <>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="container mx-auto p-6">
          <Header />
          
          <div className="mt-6" id="daily-crypto-analysis">
            <Card>
              <CardHeader className="flex flex-col gap-3 p-6 sm:p-8 bg-gradient-to-r from-[#F8F9FA]/10 via-[#E5E5E5]/10 to-[#D1D5DB]/10 border-b border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#111111] via-[#2A2A2A] to-[#4A4A4A] dark:from-white dark:via-[#E5E5E5] dark:to-[#D1D5DB] bg-clip-text text-transparent">
                      Daily Crypto Analysis
                    </h2>
                    <p className="text-sm sm:text-base text-[#4A4A4A] dark:text-[#D1D5DB]">
                      Last Update: {article?.createdAt ? formatDate(article.createdAt) : '--'}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-muted-foreground/50"
                      aria-hidden="true"
                    >
                      <path d="M12 2v20M2 12h20M7 17l5-5 5 5M7 7l5 5 5-5" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none p-1 sm:p-8">
                <CryptoArticle content={article?.content || 'No article available at this time.'} />
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6" id="crypto-statistics">
            <Card>
              <CardHeader className="flex flex-col gap-3 p-6 sm:p-8 bg-gradient-to-r from-[#F8F9FA]/10 via-[#E5E5E5]/10 to-[#D1D5DB]/10 border-b border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#111111] via-[#2A2A2A] to-[#4A4A4A] dark:from-white dark:via-[#E5E5E5] dark:to-[#D1D5DB] bg-clip-text text-transparent">
                    Crypto Statistics
                  </h2>
                  <div className="hidden sm:block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-muted-foreground/50"
                      aria-hidden="true"
                    >
                      <path d="M16 8v8m-8-8v8M7 20h10M7 4h10M5 8h14M5 16h14" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6 sm:p-8">
                {/* Market Metrics */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Market Cap</h3>
                      <p className="text-xl font-bold">
                        ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + (coin.market_cap || 0), 0) / 1e12).toFixed(2)}T
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">24h Volume</h3>
                      <p className="text-xl font-bold">
                        ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + Number(coin.volume || 0), 0) / 1e9).toFixed(2)}B
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Cryptos</h3>
                      <p className="text-xl font-bold">
                        {cryptoData.filter((coin: CryptoData) => coin.price > 0).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg. Market Cap</h3>
                      <p className="text-xl font-bold">
                        ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + (coin.market_cap || 0), 0) / cryptoData.length / 1e9).toFixed(2)}B
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Market Performance */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-medium">Best Performers (24h)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        {cryptoData
                          .sort((a: CryptoData, b: CryptoData) => b.change - a.change)
                          .slice(0, 5)
                          .map((coin: CryptoData) => (
                            <div key={coin.symbol} className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="relative h-6 w-6 rounded-full overflow-hidden">
                                  {logoMap[coin.symbol] && typeof logoMap[coin.symbol] === 'string' ? (
                                    <Image
                                      src={logoMap[coin.symbol] as string}
                                      alt={`${coin.name} logo`}
                                      className="object-contain"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                      <span className="text-xs font-medium">{coin.symbol[0]}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium">{coin.symbol}</span>
                              </div>
                              <span className="text-base font-medium text-green-500">+{coin.change.toFixed(2)}%</span>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-medium">Highest Volume (24h)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        {cryptoData
                          .sort((a: CryptoData, b: CryptoData) => Number(b.volume) - Number(a.volume))
                          .slice(0, 5)
                          .map((coin: CryptoData) => (
                            <div key={coin.symbol} className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                {logoMap[coin.symbol] && typeof logoMap[coin.symbol] === 'string' ? (
                                  <Image
                                    src={logoMap[coin.symbol] as string}
                                    alt={`${coin.name} logo`}
                                    className="object-contain"
                                    width={24}
                                    height={24}
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs font-medium">{coin.symbol[0]}</span>
                                  </div>
                                )}
                                <span className="font-medium">{coin.symbol}</span>
                              </div>
                              <span className="text-base font-medium">${(Number(coin.volume) / 1e9).toFixed(2)}B</span>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-medium">Largest Market Cap</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        {cryptoData
                          .sort((a: CryptoData, b: CryptoData) => (b.market_cap || 0) - (a.market_cap || 0))
                          .slice(0, 5)
                          .map((coin: CryptoData) => (
                            <div key={coin.symbol} className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                {logoMap[coin.symbol] && typeof logoMap[coin.symbol] === 'string' ? (
                                  <Image
                                    src={logoMap[coin.symbol] as string}
                                    alt={`${coin.name} logo`}
                                    className="object-contain"
                                    width={24}
                                    height={24}
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs font-medium">{coin.symbol[0]}</span>
                                  </div>
                                )}
                                <span className="font-medium">{coin.symbol}</span>
                              </div>
                              <span className="text-base font-medium">${(coin.market_cap / 1e9).toFixed(2)}B</span>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6" id="top-cryptos">
            <Card>
              <CardHeader className="flex flex-col gap-3 p-6 sm:p-8 bg-gradient-to-r from-[#F8F9FA]/10 via-[#E5E5E5]/10 to-[#D1D5DB]/10 border-b border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#111111] via-[#2A2A2A] to-[#4A4A4A] dark:from-white dark:via-[#E5E5E5] dark:to-[#D1D5DB] bg-clip-text text-transparent">
                    Top Cryptos
                  </h2>
                  <div className="hidden sm:block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-[#4A4A4A]/50 dark:text-[#D1D5DB]/50"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 7h8M8 12h8M8 17h8" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto p-6 sm:p-8">
                <MarketTable 
                  data={Array.isArray(cryptoData) ? cryptoData.map((item: CryptoData) => ({
                    ...item,
                    name: item.name || 'Unknown',
                    volume: item.volume || '0',
                    logo_url: logoMap[item.symbol] && typeof logoMap[item.symbol] === 'string' ? logoMap[item.symbol] : null,
                    market_cap: item.market_cap || 0,
                    high_24h: item.high_24h,
                    low_24h: item.low_24h,
                    total_supply: item.total_supply,
                    circulating_supply: item.circulating_supply
                  })).sort((a: CryptoData, b: CryptoData) => 
                    (b.market_cap || 0) - (a.market_cap || 0)
                  ) : []}
                  loading={false}
                  type="crypto"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6" id="crypto-price-charts">
            <Card>
              <CardHeader className="flex flex-col gap-3 p-6 sm:p-8 bg-gradient-to-r from-[#F8F9FA]/10 via-[#E5E5E5]/10 to-[#D1D5DB]/10 border-b border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#111111] via-[#2A2A2A] to-[#4A4A4A] dark:from-white dark:via-[#E5E5E5] dark:to-[#D1D5DB] bg-clip-text text-transparent">
                    Crypto Price Charts
                  </h2>
                  <div className="hidden sm:block">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-[#4A4A4A]/50 dark:text-[#D1D5DB]/50"
                      aria-hidden="true"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {sortedHistoricalData.map((coin: HistoricalCryptoData) => {
                    const cryptoInfo = cryptoData.find((c: CryptoData) => c.id === coin.coinId)
                    const formattedTimestamp = cryptoInfo?.timestamp && isValidPastDate(cryptoInfo.timestamp)
                      ? formatDate(cryptoInfo.timestamp)
                      : '--'
                    return (
                      <Card key={coin.coinId}>
                        <CardHeader className="p-4">
                          <h3 className="text-base font-medium">
                            {coin.symbol} Price (7d)
                          </h3>
                        </CardHeader>
                        <CardContent className="p-0">
                          <PriceChart
                            data={coin.data}
                            symbol={coin.symbol}
                            showAxes={false}
                            height={200}
                          />
                          <div className="p-4 text-sm text-muted-foreground border-t">
                            <div className="font-medium">{cryptoInfo?.name || 'Crypto'} | Price: ${cryptoInfo?.price.toFixed(2) || '--'} | {formattedTimestamp}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <SiteFooter />
        </div>
      </>
    )
  } catch (error) {
    console.error('Error in Home component:', error)
    return (
      <div className="container mx-auto p-6">
        <Header />
        <div className="mt-6">
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-2xl font-bold text-red-600">
                Temporarily Unavailable
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                We are currently experiencing high traffic and have reached our API rate limit. 
                Please try again in a few minutes. Our system will automatically refresh the data 
                once the rate limit resets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
