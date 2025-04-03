import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { format } from 'date-fns'
import { CryptoArticle } from "../components/crypto-article"
import { Header } from "@/components/header"
import { checkAndUpdateCryptoData, getLatestCryptoData } from "@/lib/services/crypto-service"
import prisma from '@/lib/prisma'
import Script from 'next/script'
import { CryptoData, HistoricalDataPoint, HistoricalCryptoData } from "@/types/crypto"
import { formatDate, isValidPastDate } from "@/lib/utils/date"
import { ImageGallery } from '@/components/ui/image-gallery'

export const revalidate = 3600 // Revalidate every hour

async function getCryptoData(): Promise<CryptoData[]> {
  // Check and update if needed
  await checkAndUpdateCryptoData()
  
  // Always return latest data
  return getLatestCryptoData()
}

async function getLatestArticle() {
  const article = await prisma.article.findFirst({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return article
}

export default async function Home() {
  const [cryptoData, article] = await Promise.all([
    getCryptoData(),
    getLatestArticle()
  ])
  const lastUpdated = cryptoData[0]?.timestamp

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
  
  // Fetch historical data for all cryptocurrencies in a single query
  const historicalData = await getHistoricalData(symbols)

  // Prepare structured data for the page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Crypto Market Insights",
    "description": "Real-time cryptocurrency market analysis and price tracking",
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
        <div className="container mx-auto px-3 sm:px-6 pt-6 sm:pt-8">
          <Header />
          
          <nav className="sticky top-4 z-50 mx-auto max-w-fit rounded-full bg-background/95 px-3 sm:px-8 py-2 sm:py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60 border mt-6 sm:mt-8">
            <ul className="flex items-center gap-2 sm:gap-8 text-xs sm:text-sm">
              <li>
                <a 
                  href="#daily-crypto-analysis" 
                  className="relative text-muted-foreground transition-colors hover:text-primary after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                >
                  Daily Analysis
                </a>
              </li>
              <li>
                <a 
                  href="#top-cryptocurrencies" 
                  className="relative text-muted-foreground transition-colors hover:text-primary after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                >
                  Top Cryptos
                </a>
              </li>
              <li>
                <a 
                  href="#cryptocurrency-price-charts" 
                  className="relative text-muted-foreground transition-colors hover:text-primary after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                >
                  Price Charts
                </a>
              </li>
            </ul>
          </nav>

          <section className="my-6 md:my-12">
            <ImageGallery />
          </section>

          <main className="grid gap-6">
            <section id="daily-crypto-analysis" className="grid gap-6 lg:grid-cols-8 scroll-mt-24">
              <article className="lg:col-span-4">
                <Card className="h-full">
                  <CardHeader className="flex flex-col gap-2 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl md:text-2xl font-bold">Daily Crypto Analysis</h2>
                    </div>
                    <time className="text-sm text-muted-foreground">
                      Last Update: {article?.createdAt ? formatDate(article.createdAt) : '--'}
                    </time>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none">
                      <CryptoArticle content={article?.content || 'No article available at this time.'} />
                    </div>
                  </CardContent>
                </Card>
              </article>

              <section className="lg:col-span-4 flex flex-col gap-6">
                <Card className="h-full">
                  <CardHeader className="p-6">
                    <h2 className="text-xl md:text-2xl font-bold">Market Statistics</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Market Cap</h3>
                        <p className="text-2xl font-bold">
                          ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + (coin.market_cap || 0), 0) / 1e12).toFixed(2)}T
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">24h Volume</h3>
                        <p className="text-2xl font-bold">
                          ${(cryptoData.reduce((acc: number, coin: CryptoData) => acc + Number(coin.volume || 0), 0) / 1e9).toFixed(2)}B
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Active Cryptocurrencies</h3>
                        <p className="text-2xl font-bold">
                          {cryptoData.filter((coin: CryptoData) => coin.price > 0).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card id="top-cryptocurrencies" className="h-full scroll-mt-24">
                  <CardHeader className="p-6">
                    <h2 className="text-xl md:text-2xl font-bold">Top Cryptocurrencies</h2>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <MarketTable 
                      data={(cryptoData || [])
                        .map((item: CryptoData) => ({
                          ...item,
                          name: item.name || 'Unknown',
                          volume: item.volume || '0'
                        }))
                        .sort((a: CryptoData, b: CryptoData) => a.name.localeCompare(b.name))
                      }
                      loading={false}
                      type="crypto"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="p-6">
                    <h2 className="text-lg md:text-xl font-semibold">Market Highlights</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Best Performers (24h)</h3>
                        <div className="space-y-2">
                          {cryptoData
                            .sort((a: CryptoData, b: CryptoData) => b.change - a.change)
                            .slice(0, 3)
                            .map((coin: CryptoData) => (
                              <div key={coin.symbol} className="flex items-center justify-between">
                                <span className="text-sm">{coin.symbol}</span>
                                <span className="text-sm text-green-500">+{coin.change.toFixed(2)}%</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Highest Volume (24h)</h3>
                        <div className="space-y-2">
                          {cryptoData
                            .sort((a: CryptoData, b: CryptoData) => Number(b.volume) - Number(a.volume))
                            .slice(0, 3)
                            .map((coin: CryptoData) => (
                              <div key={coin.symbol} className="flex items-center justify-between">
                                <span className="text-sm">{coin.symbol}</span>
                                <span className="text-sm">${(Number(coin.volume) / 1e9).toFixed(2)}B</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </section>

            <section id="cryptocurrency-price-charts" className="scroll-mt-24">
              <Card>
                <CardHeader className="p-6">
                  <h2 className="text-xl md:text-2xl font-bold">Cryptocurrency Price Charts</h2>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {sortedHistoricalData.map((coin: HistoricalCryptoData) => {
                      const cryptoInfo = cryptoData.find((c: CryptoData) => c.id === coin.coinId)
                      const formattedTimestamp = cryptoInfo?.timestamp && isValidPastDate(cryptoInfo.timestamp)
                        ? formatDate(cryptoInfo.timestamp)
                        : '--'
                      return (
                        <article key={coin.coinId} className="overflow-hidden rounded-lg border hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="p-4 bg-muted/50">
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
                              <div className="font-medium">{cryptoInfo?.name || 'Cryptocurrency'} | Price: ${cryptoInfo?.price.toFixed(2) || '--'} | {formattedTimestamp}
                              </div>
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
                    Cryptocurrency investments are volatile and high-risk. Always conduct your own research before making any investment decisions.
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
