import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'

// Marcar esta ruta como dinámica para evitar errores de generación estática
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hora

export async function GET() {
  try {
    // Obtener datos locales
    const latestData = await prisma.marketData.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Obtener datos globales de CoinGecko
    const globalData = await cryptoAPI.getGlobalData()

    // Calcular estadísticas locales
    const totalMarketCap = latestData.reduce((acc, coin) => acc + (coin.market_cap || 0), 0)
    const totalVolume = latestData.reduce((acc, coin) => acc + Number(coin.volume || 0), 0)
    const activeCryptos = new Set(latestData.map(coin => coin.symbol)).size

    // Encontrar los mejores y peores performers
    const performers = latestData
      .sort((a, b) => b.change - a.change)
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol,
        change: coin.change
      }))

    const worstPerformers = latestData
      .sort((a, b) => a.change - b.change)
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol,
        change: coin.change
      }))

    const stats = {
      // Estadísticas locales
      totalMarketCap,
      totalVolume,
      activeCryptos,
      topPerformers: performers,
      worstPerformers,
      
      // Estadísticas globales de CoinGecko
      global: {
        activeCryptos: globalData.active_cryptocurrencies,
        totalMarketCap: globalData.total_market_cap.usd,
        totalVolume: globalData.total_volume.usd,
        btcDominance: globalData.market_cap_percentage.btc,
        ethDominance: globalData.market_cap_percentage.eth,
        marketCapChange: globalData.market_cap_change_percentage_24h_usd,
        volumeChange: globalData.total_volume_change_24h,
        activeExchanges: globalData.markets,
        ongoingIcos: globalData.ongoing_icos,
        upcomingIcos: globalData.upcoming_icos,
        endedIcos: globalData.ended_icos
      },
      
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=59'
      }
    })
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market statistics' },
      { status: 500 }
    )
  }
} 