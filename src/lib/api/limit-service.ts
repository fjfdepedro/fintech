import prisma from '@/lib/prisma'

export const API_LIMITS = {
  coingecko: {
    dailyLimit: 30,  // por minuto en plan gratuito
    name: 'CoinGecko',
    key: null // No requiere key
  }
} as const

export type ApiName = keyof typeof API_LIMITS

export async function checkAndUpdateApiLimit(apiName: ApiName) {
  const now = new Date()
  const limit = await prisma.apiLimit.upsert({
    where: { apiName },
    create: {
      apiName,
      dailyLimit: API_LIMITS[apiName].dailyLimit,
      requestCount: 1,
      lastReset: now
    },
    update: {
      requestCount: {
        increment: 1
      }
    }
  })

  // Reset contador si ha pasado un día
  if (now.getTime() - limit.lastReset.getTime() > 24 * 60 * 60 * 1000) {
    await prisma.apiLimit.update({
      where: { apiName },
      data: {
        requestCount: 1,
        lastReset: now
      }
    })
    return {
      canMakeRequest: true,
      remaining: API_LIMITS[apiName].dailyLimit - 1,
      isNewDay: true
    }
  }

  return {
    canMakeRequest: limit.requestCount <= limit.dailyLimit,
    remaining: limit.dailyLimit - limit.requestCount,
    isNewDay: false
  }
}
