import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/widgets/metric-card"
import { PriceChart } from "@/components/charts/price-chart"
import { MarketTable } from "@/components/widgets/market-table"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from 'date-fns'
import { CryptoArticle } from "../components/crypto-article"
import prisma from '@/lib/prisma'

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
                    <CryptoArticle content={article?.content || 'No article available at this time.'} />
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
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cryptocurrency Price Charts</CardTitle>
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
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
