import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriceChart } from "@/components/charts/price-chart"
import { cryptoAPI } from '@/lib/api/crypto-service'
import { formatDate, formatNumber, formatPercentage } from "@/lib/utils"
import { CryptoDetailedData, DefiData, OnChainMetrics, SentimentData } from "@/types/crypto"
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import prisma from '@/lib/prisma'

// Force static generation with ISR
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

interface PageProps {
  params: {
    symbol: string
  }
}

interface ExchangeTicker {
  market: {
    name: string
    logo?: string
  }
  base: string
  target: string
  converted_last: {
    usd: number
  }
  converted_volume: {
    usd: number
  }
}

interface OnChainDataResponse {
  prices: [number, number][]
  total_volumes: [number, number][]
  market_caps: [number, number][]
}

interface MessariData {
  market_data?: {
    volume_last_24h?: number;
    real_volume_last_24h?: number;
  };
  roi_data?: {
    percent_change_last_1_week?: number;
    percent_change_last_1_month?: number;
  };
  mining_stats?: Record<string, number>;
  developer_activity?: Record<string, number>;
  supply?: {
    liquid?: number;
    circulating?: number;
    total?: number;
  };
}

// Loading component
function LoadingState() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48" />
            <div className="flex flex-wrap gap-2 mt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-24 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default async function CryptoDetailPage({ params }: PageProps) {
  try {
    const coinId = params.symbol.toLowerCase()

    // First try to get basic market data to show something quickly
    const marketData = await prisma.marketData.findFirst({
      where: {
        symbol: params.symbol.toUpperCase()
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (!marketData) {
      return <LoadingState />
    }

    // Then fetch detailed data
    const [cryptoDetail, onChainData, exchanges, defiData, messariData] = await Promise.allSettled([
      cryptoAPI.getCryptoDetail(coinId),
      cryptoAPI.getOnChainData(coinId),
      cryptoAPI.getExchangesList(coinId),
      cryptoAPI.getDefiProtocolData(coinId),
      cryptoAPI.getMessariMetrics(coinId)
    ])

    // Solo usamos los datos que se resolvieron exitosamente
    const detail = cryptoDetail.status === 'fulfilled' ? cryptoDetail.value : null
    const onChain = onChainData.status === 'fulfilled' ? onChainData.value : null
    const exchangesList = exchanges.status === 'fulfilled' ? exchanges.value : null
    const defi = defiData.status === 'fulfilled' ? defiData.value : null
    const messari = messariData.status === 'fulfilled' ? messariData.value as MessariData : null

    // If we don't have detailed data, use market data as fallback
    if (!detail) {
      return (
        <div className="container mx-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl font-bold">{marketData.symbol[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{marketData.symbol}</h1>
                  <Badge variant="outline">{marketData.symbol}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold">
                ${formatNumber(marketData.price)}
              </div>
              <div className={`text-lg ${marketData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(marketData.change)}% (24h)
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Price</div>
                  <div className="text-2xl font-bold">${formatNumber(marketData.price)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">24h Change</div>
                  <div className={`text-2xl font-bold ${marketData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(marketData.change)}%
                  </div>
                </div>
                {marketData.volume && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Volume</div>
                    <div className="text-2xl font-bold">${formatNumber(Number(marketData.volume))}</div>
                  </div>
                )}
                {marketData.market_cap && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Market Cap</div>
                    <div className="text-2xl font-bold">${formatNumber(marketData.market_cap)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            {detail?.image?.large && (
              <Image
                src={detail.image.large}
                alt={`${detail.name} logo`}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{detail?.name}</h1>
                <Badge variant="outline">{detail?.symbol.toUpperCase()}</Badge>
              </div>
              {detail?.categories && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {detail.categories.map((category: string) => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold">
              ${formatNumber(detail?.price)}
            </div>
            <div className={`text-lg ${detail?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(detail?.change)}% (24h)
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Market Cap Rank</div>
              <div className="text-2xl font-bold">#{detail?.sentiment?.market_cap_rank || 'N/A'}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Market Cap</div>
              <div className="text-2xl font-bold">${formatNumber(detail?.market_cap)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">24h Volume</div>
              <div className="text-2xl font-bold">${formatNumber(Number(detail?.volume))}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Circulating Supply</div>
              <div className="text-2xl font-bold">
                {formatNumber(detail?.circulating_supply || 0)} {detail?.symbol.toUpperCase()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="social">Social & Development</TabsTrigger>
            <TabsTrigger value="onchain">On-Chain Data</TabsTrigger>
            {defi?.isDefiProtocol && <TabsTrigger value="defi">DeFi</TabsTrigger>}
            {messari && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Price Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Price Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart
                    data={onChain?.prices.map(([timestamp, price]: [number, number]) => ({
                      date: new Date(timestamp),
                      value: price
                    }))}
                    symbol={detail?.symbol.toUpperCase()}
                    height={400}
                  />
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About {detail?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert">
                    {detail?.description?.en ? (
                      <p>{detail.description.en}</p>
                    ) : (
                      <p>No description available.</p>
                    )}
                  </div>
                  
                  {detail?.links && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Links</h4>
                      <div className="flex flex-wrap gap-2">
                        {detail.links.homepage[0] && (
                          <a
                            href={detail.links.homepage[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Website
                          </a>
                        )}
                        {detail.links.blockchain_site?.filter(Boolean).map((site: string, index: number) => (
                          <a
                            key={site}
                            href={site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Explorer {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">All Time High</div>
                      <div className="text-lg font-bold">
                        ${formatNumber(detail?.market_data?.ath?.usd || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {detail?.market_data?.ath_date?.usd && 
                          formatDate(new Date(detail.market_data.ath_date.usd))
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">All Time Low</div>
                      <div className="text-lg font-bold">
                        ${formatNumber(detail?.market_data?.atl?.usd || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {detail?.market_data?.atl_date?.usd && 
                          formatDate(new Date(detail.market_data.atl_date.usd))
                        }
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Supply Information</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Circulating Supply</span>
                        <span className="font-medium">
                          {formatNumber(detail?.circulating_supply || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Supply</span>
                        <span className="font-medium">
                          {formatNumber(detail?.total_supply || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Trading Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exchangesList?.tickers?.slice(0, 10).map((ticker: any) => (
                    <div key={`${ticker.market.name}-${ticker.base}-${ticker.target}`} 
                         className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        {ticker.market.logo && (
                          <Image
                            src={ticker.market.logo}
                            alt={ticker.market.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{ticker.market.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {ticker.base}/{ticker.target}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${formatNumber(ticker.converted_last.usd)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Vol: ${formatNumber(ticker.converted_volume.usd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Development Tab */}
          <TabsContent value="social" className="space-y-6">
            {detail?.social_metrics && (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Social Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Twitter Followers</span>
                        <span className="font-medium">
                          {formatNumber(detail.social_metrics.twitter_followers)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Reddit Subscribers</span>
                        <span className="font-medium">
                          {formatNumber(detail.social_metrics.reddit_subscribers)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Telegram Members</span>
                        <span className="font-medium">
                          {formatNumber(detail.social_metrics.telegram_channel_user_count)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Development Stats */}
                {detail.social_metrics.github_stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Development Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>GitHub Stars</span>
                          <span className="font-medium">
                            {formatNumber(detail.social_metrics.github_stats.stars)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Issues</span>
                          <span className="font-medium">
                            {formatNumber(detail.social_metrics.github_stats.total_issues)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Closed Issues</span>
                          <span className="font-medium">
                            {formatNumber(detail.social_metrics.github_stats.closed_issues)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Pull Requests Merged</span>
                          <span className="font-medium">
                            {formatNumber(detail.social_metrics.github_stats.pull_requests_merged)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Contributors</span>
                          <span className="font-medium">
                            {formatNumber(detail.social_metrics.github_stats.pull_request_contributors)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* On-Chain Data Tab */}
          <TabsContent value="onchain" className="space-y-6">
            {detail?.on_chain_metrics && (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Active Addresses</span>
                        <span className="font-medium">
                          {formatNumber(detail.on_chain_metrics.active_addresses)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transaction Count</span>
                        <span className="font-medium">
                          {formatNumber(detail.on_chain_metrics.transaction_count)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Average Transaction Value</span>
                        <span className="font-medium">
                          ${formatNumber(detail.on_chain_metrics.average_transaction_value)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mining Stats if applicable */}
                {(detail.on_chain_metrics.mining_difficulty || 
                  detail.on_chain_metrics.hash_rate) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mining Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {detail.on_chain_metrics.mining_difficulty && (
                        <div className="flex justify-between items-center">
                          <span>Mining Difficulty</span>
                          <span className="font-medium">
                            {formatNumber(detail.on_chain_metrics.mining_difficulty)}
                          </span>
                        </div>
                      )}
                      {detail.on_chain_metrics.hash_rate && (
                        <div className="flex justify-between items-center">
                          <span>Hash Rate</span>
                          <span className="font-medium">
                            {formatNumber(detail.on_chain_metrics.hash_rate)} H/s
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Charts */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Transaction Volume (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceChart
                      data={onChain?.total_volumes.map(([timestamp, volume]: [number, number]) => ({
                        date: new Date(timestamp),
                        value: volume
                      }))}
                      symbol={`${detail?.symbol.toUpperCase()} Volume`}
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* DeFi Tab */}
          {defi?.isDefiProtocol && (
            <TabsContent value="defi" className="space-y-6">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Protocol Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Value Locked (TVL)</span>
                        <span className="text-2xl font-bold">
                          ${formatNumber(defi?.tvl ?? 0)}
                        </span>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">TVL by Chain</h4>
                        {Object.entries(defi?.currentChainTvls ?? {}).map(([chain, tvl]) => (
                          <div key={chain} className="flex justify-between items-center">
                            <span className="text-sm">{chain}</span>
                            <span className="font-medium">${formatNumber(tvl as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {defi?.tokens && Object.keys(defi.tokens).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Token Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {Object.entries(defi.tokens).map(([token, data]: [string, any]) => (
                          <div key={token} className="flex justify-between items-center">
                            <span>{token}</span>
                            <span className="font-medium">${formatNumber(data?.tvl ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* Messari Metrics Tab */}
          {messari && (
            <TabsContent value="metrics" className="space-y-6">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Market Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {messari.market_data && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>24h Volume</span>
                          <span className="font-medium">
                            ${formatNumber(messari.market_data.volume_last_24h ?? 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Real Volume 24h</span>
                          <span className="font-medium">
                            ${formatNumber(messari.market_data.real_volume_last_24h ?? 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ROI Data */}
                {messari.roi_data && (
                  <Card>
                    <CardHeader>
                      <CardTitle>ROI Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>7d Change</span>
                          <span className={`font-medium ${(messari.roi_data.percent_change_last_1_week ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercentage(messari.roi_data.percent_change_last_1_week ?? 0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>30d Change</span>
                          <span className={`font-medium ${(messari.roi_data.percent_change_last_1_month ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercentage(messari.roi_data.percent_change_last_1_month ?? 0)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mining Stats */}
                {messari.mining_stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mining Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {Object.entries(messari.mining_stats).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                            <span className="font-medium">{formatNumber(value as number)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Developer Activity */}
                {messari.developer_activity && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Developer Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {Object.entries(messari.developer_activity).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                            <span className="font-medium">{formatNumber(value as number)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error('Error in CryptoDetailPage:', error)
    notFound()
  }
}
