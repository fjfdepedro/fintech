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

// Force static generation with ISR
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

async function getCryptoData(): Promise<CryptoData[]> {
  // During build, only get data from database
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return getLatestCryptoData()
  }

  // During runtime, check and update if needed
  await checkAndUpdateCryptoData()
  return getLatestCryptoData()
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

// Function to get crypto metadata
async function getCryptoMetadata() {
  return prisma.cryptoMarketMetadata.findMany({
    select: {
      symbol: true,
      logo_url: true
    }
  })
}

export default async function Home() {
  // Use Next.js fetch with cache
  const [cryptoData, article, cryptoMetadata] = await Promise.all([
    getCryptoData(),
    getArticle(),
    getCryptoMetadata()
  ])
  
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

  async function getHistoricalData(symbols: string[]): Promise<HistoricalCryptoData[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Fetch all historical data in a single query
    const historicalData = await prisma.marketData.findMany({
      where: {
        symbol: {
          in: symbols.map(s => s.toUpperCase())
        },
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        symbol: true,
        price: true,
        timestamp: true
      }
    })

    // Agrupar los datos por símbolo
    const groupedData = historicalData.reduce((acc, record) => {
      if (!acc[record.symbol]) {
        acc[record.symbol] = []
      }
      acc[record.symbol].push({
        date: record.timestamp,
        value: record.price
      })
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
  const historicalData = await getHistoricalData(symbols)

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
          <Header />

          <div className="max-w-[1400px] mx-auto">
            <section className="my-4 sm:my-6 md:my-12">
              <ImageGallery />
            </section>

            <main className="grid gap-4 sm:gap-6">
              <section id="daily-crypto-analysis" className="scroll-mt-20 sm:scroll-mt-24">
                <Card className="h-full bg-gradient-to-br from-[#F8F9FA]/5 via-[#E5E5E5]/5 to-[#D1D5DB]/5 hover:shadow-xl transition-all duration-300 border border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                  <CardHeader className="flex flex-col gap-3 p-6 sm:p-8 bg-gradient-to-r from-[#F8F9FA]/10 via-[#E5E5E5]/10 to-[#D1D5DB]/10 border-b border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#111111] via-[#2A2A2A] to-[#4A4A4A] dark:from-white dark:via-[#E5E5E5] dark:to-[#D1D5DB] bg-clip-text text-transparent">
                          Daily Crypto Analysis
                        </h2>
                        <time className="text-sm sm:text-base text-[#4A4A4A] dark:text-[#D1D5DB]">
                          Last Update: {article?.createdAt ? formatDate(article.createdAt) : '--'}
                        </time>
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
                  <CardContent className="p-6 sm:p-8 overflow-x-hidden">
                    <div className="prose prose-sm sm:prose-base lg:prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-lead:text-muted-foreground prose-p:leading-relaxed">
                      <CryptoArticle content={article?.content || 'No article available at this time.'} />
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="crypto-statistics" className="scroll-mt-24">
                <Card className="h-full bg-gradient-to-br from-[#F8F9FA]/5 via-[#E5E5E5]/5 to-[#D1D5DB]/5 hover:shadow-xl transition-all duration-300 border border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
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
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Main Market Metrics */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      <Card className="bg-gradient-to-br from-[#F8F9FA]/10 to-[#E5E5E5]/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-sm font-medium text-[#4A4A4A] dark:text-[#D1D5DB] mb-2">Total Market Cap</h3>
                          <p className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
                            ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + (coin.market_cap || 0), 0) / 1e12).toFixed(2)}T
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">24h Volume</h3>
                          <p className="text-2xl sm:text-3xl font-bold">
                            ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + Number(coin.volume || 0), 0) / 1e9).toFixed(2)}B
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Cryptos</h3>
                          <p className="text-2xl sm:text-3xl font-bold">
                            {cryptoData.filter((coin: CryptoData) => coin.price > 0).length}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg. Market Cap</h3>
                          <p className="text-2xl sm:text-3xl font-bold">
                            ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + (coin.market_cap || 0), 0) / cryptoData.length / 1e9).toFixed(2)}B
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Market Performance */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <Card className="hover:shadow-lg transition-all">
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
                                      <Image
                                        src={logoMap[coin.symbol] || ''}
                                        alt={`${coin.name} logo`}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                      />
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

                      <Card className="hover:shadow-lg transition-all">
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
                                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                                      <Image
                                        src={logoMap[coin.symbol] || ''}
                                        alt={`${coin.name} logo`}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                      />
                                    </div>
                                    <span className="font-medium">{coin.symbol}</span>
                                  </div>
                                  <span className="text-base font-medium">${(Number(coin.volume) / 1e9).toFixed(2)}B</span>
                                </div>
                              ))
                            }
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-all">
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
                                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                                      <Image
                                        src={logoMap[coin.symbol] || ''}
                                        alt={`${coin.name} logo`}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                      />
                                    </div>
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
              </section>

              <section id="top-cryptos" className="scroll-mt-24">
                <Card className="h-full bg-gradient-to-br from-[#F8F9FA]/5 via-[#E5E5E5]/5 to-[#D1D5DB]/5 hover:shadow-xl transition-all duration-300 border border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
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
                  <CardContent className="p-6 sm:p-8 overflow-x-auto">
                    <div className="min-w-[300px]">
                      <MarketTable 
                        data={Array.isArray(cryptoData) ? cryptoData.map((item: CryptoData) => ({
                          ...item,
                          name: item.name || 'Unknown',
                          volume: item.volume || '0',
                          logo_url: logoMap[item.symbol] || null,
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
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="crypto-price-charts" className="scroll-mt-24">
                <Card className="h-full bg-gradient-to-br from-[#F8F9FA]/5 via-[#E5E5E5]/5 to-[#D1D5DB]/5 hover:shadow-xl transition-all duration-300 border border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
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
                          <article key={coin.coinId} className="overflow-hidden rounded-lg border border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20 hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="p-4 bg-[#F8F9FA]/50 dark:bg-[#111111]/50">
                              <h3 className="text-base font-medium text-[#2A2A2A] dark:text-[#E5E5E5]">
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
                              <div className="p-4 text-sm text-[#4A4A4A] dark:text-[#D1D5DB] border-t border-[#D1D5DB]/20 dark:border-[#2A2A2A]/20">
                                <div className="font-medium">{cryptoInfo?.name || 'Crypto'} | Price: ${cryptoInfo?.price.toFixed(2) || '--'} | {formattedTimestamp}</div>
                              </div>
                            </CardContent>
                          </article>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>


            </main>

            <section className="my-8">
            </section>
          </div>

          <footer className="mt-12 py-8 border-t border-border">
            <div className="px-4">
              <div className="grid gap-8 md:grid-cols-3">
                <div>
                  <h3 className="font-semibold mb-3">Legal</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="/terms" className="hover:underline">Terms of Service</a></li>
                    <li><a href="/privacy" className="hover:underline">Privacy Policy</a></li>
                    <li><a href="/cookies" className="hover:underline">Cookie Policy</a></li>
                    <li><a href="/gdpr" className="hover:underline">GDPR Compliance</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    The information provided on this site is for informational purposes only and should not be considered financial advice. 
                    Crypto investments are volatile and high-risk. Always conduct your own research before making any investment decisions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Data Sources</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Last updated: {formattedLastUpdated}</li>
                    <li>All times shown in GMT</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} Crypto Market Insights. All rights reserved.</p>
                  <p>Made with ❤️ for the crypto community</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
