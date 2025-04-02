import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { format } from 'date-fns'
import { CryptoArticle } from "../components/crypto-article"
import { Header } from "@/components/header"
import prisma from '@/lib/prisma'
import Script from 'next/script'

export const revalidate = 3600 // Revalidate every hour

async function getCryptoData() {
  const symbols = await prisma.marketData.findMany({
    select: { symbol: true },
    distinct: ['symbol']
  })

  const cryptoData = await prisma.marketData.findMany({
    where: {
      symbol: { in: symbols.map(s => s.symbol) }
    },
    orderBy: { timestamp: 'desc' },
    distinct: ['symbol'],
    take: 25
  })

  return cryptoData
}

async function getHistoricalData(symbol: string) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const historicalData = await prisma.marketData.findMany({
    where: {
      symbol: symbol.toUpperCase(),
      timestamp: {
        gte: startDate
      }
    },
    orderBy: {
      timestamp: 'asc'
    },
    select: {
      price: true,
      timestamp: true
    }
  })

  return historicalData.map(record => ({
    date: record.timestamp,
    value: record.price
  }))
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

  // Fetch historical data for all cryptocurrencies in parallel
  const historicalDataPromises = cryptoData.map(async (coin) => {
    try {
      const data = await getHistoricalData(coin.symbol)
      return {
        coinId: coin.id,
        symbol: coin.symbol,
        data
      }
    } catch (error) {
      console.error(`Error fetching historical data for ${coin.symbol}:`, error)
      return {
        coinId: coin.id,
        symbol: coin.symbol,
        data: []
      }
    }
  })

  const historicalData = await Promise.all(historicalDataPromises)

  // Prepare structured data for the page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Crypto Market Insights",
    "description": "Real-time cryptocurrency market analysis and price tracking",
    "dateModified": lastUpdated ? new Date(lastUpdated).toISOString() : new Date().toISOString(),
    "mainEntity": {
      "@type": "DataFeed",
      "dataFeedElement": cryptoData.map(coin => ({
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
  const formattedLastUpdated = lastUpdated 
    ? format(new Date(new Date(lastUpdated).toUTCString()), "'Last Update:' MMM d, yyyy 'at' HH:mm 'GMT'")
    : '--'

  // Sort historical data consistently
  const sortedHistoricalData = [...historicalData].sort((a, b) => {
    const nameA = cryptoData.find(c => c.id === a.coinId)?.name || '';
    const nameB = cryptoData.find(c => c.id === b.coinId)?.name || '';
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

        <main className="grid gap-4">
          <section className="grid gap-4 lg:grid-cols-8">
            <article className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Daily Crypto Analysis</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <CryptoArticle content={article?.content || 'No article available at this time.'} />
                  </div>
                </CardContent>
              </Card>
            </article>

            <section className="lg:col-span-4 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
                    <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <div className="text-2xl font-bold">
                      ${(cryptoData.reduce((acc, coin) => acc + (coin.market_cap || 0), 0) / 1e12).toFixed(2)}T
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total value of all cryptocurrencies at current prices
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
                    <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <div className="text-2xl font-bold">
                      ${(cryptoData.reduce((acc, coin) => acc + Number(coin.volume || 0), 0) / 1e9).toFixed(2)}B
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Amount traded across all pairs in the last 24 hours
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
                    <CardTitle className="text-sm font-medium">Active Cryptocurrencies</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <div className="text-2xl font-bold">
                      {cryptoData.filter(coin => coin.price > 0).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Number of cryptocurrencies currently being tracked
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="h-full">
                <CardHeader className="py-3">
                  <h2 className="text-2xl font-bold">Top Cryptocurrencies</h2>
                </CardHeader>
                <CardContent>
                  <MarketTable 
                    data={(cryptoData || [])
                      .map(item => ({
                        ...item,
                        name: item.name || 'Unknown',
                        volume: item.volume || '0'
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name))
                    }
                    loading={false}
                    type="crypto"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="py-3">
                  <h2 className="text-lg font-semibold">Market Highlights</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Best Performers (24h)</h3>
                      <div className="space-y-2">
                        {cryptoData
                          .sort((a, b) => b.change - a.change)
                          .slice(0, 3)
                          .map(coin => (
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
                          .sort((a, b) => Number(b.volume) - Number(a.volume))
                          .slice(0, 3)
                          .map(coin => (
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

          <section>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Cryptocurrency Price Charts</h2>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {sortedHistoricalData.map(coin => {
                    const cryptoInfo = cryptoData.find(c => c.id === coin.coinId)
                    const formattedTimestamp = cryptoInfo?.timestamp 
                      ? format(new Date(cryptoInfo.timestamp), 'MMM dd, yyyy HH:mm') + ' GMT'
                      : '--'
                    return (
                      <article key={coin.coinId} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="p-4 bg-muted/50">
                          <h3 className="text-sm font-medium">
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
                            <div className="font-medium">{cryptoInfo?.name || 'Cryptocurrency'}</div>
                            <div className="mt-1">Price: ${cryptoInfo?.price.toFixed(2) || '--'}</div>
                            <time className="text-xs mt-1 block">
                              {formattedTimestamp}
                            </time>
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

        <footer className="mt-12 py-6 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-4">
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
              <div>
                <h3 className="font-semibold mb-3">Resources</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/issues" className="hover:underline">Report an issue</a></li>
                  <li><a href="/docs/api" className="hover:underline">API Documentation</a></li>
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
    </>
  )
}
