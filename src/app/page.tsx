import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { format } from 'date-fns'
import { CryptoArticle } from "../components/crypto-article"
import prisma from '@/lib/prisma'
import Script from 'next/script'

export const revalidate = 3600 // Revalidate every hour

async function getCryptoData() {
  const cryptoData = await prisma.marketData.findMany({
    orderBy: { timestamp: 'desc' },
    take: 25,
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
  const now = new Date()
  const startOfHour = new Date(now.setMinutes(0, 0, 0))
  const endOfHour = new Date(now.setTime(now.getTime() + 60 * 60 * 1000 - 1))

  const article = await prisma.article.findFirst({
    where: {
      createdAt: {
        gte: startOfHour,
        lte: endOfHour
      }
    },
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

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M12 2v20M2 12h20M7 17l5-5 5 5M7 7l5 5 5-5" />
          </svg>
          <h1 className="font-bold text-2xl">
            Crypto Market Insights
          </h1>
        </div>

        <main className="grid gap-6">
          <section className="grid gap-6 lg:grid-cols-5">
            <article className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <h2 className="text-2xl font-bold">Daily Crypto Analysis</h2>
                  <time className="text-sm text-muted-foreground">
                    Last Update: {lastUpdated ? format(new Date(lastUpdated), 'MMMM d, yyyy') + ' at ' + format(new Date(lastUpdated), 'HH:mm') + ' GMT' : '--'}
                  </time>
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
                      <CryptoArticle content={article?.content || 'No article available at this time.'} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </article>

            <section className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
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
            </section>
          </section>

          <section>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Cryptocurrency Price Charts</h2>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {historicalData
                    .sort((a, b) => {
                      const nameA = cryptoData.find(c => c.id === a.coinId)?.name || '';
                      const nameB = cryptoData.find(c => c.id === b.coinId)?.name || '';
                      return nameA.localeCompare(nameB);
                    })
                    .map(coin => {
                      const cryptoInfo = cryptoData.find(c => c.id === coin.coinId)
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
                                {cryptoInfo?.timestamp ? format(new Date(cryptoInfo.timestamp), 'MMM dd, yyyy HH:mm') + ' GMT' : '--'}
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
      </div>
    </>
  )
}
