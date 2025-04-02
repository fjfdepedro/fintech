'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { cryptoAPI } from '@/lib/api/crypto-service'
import { articleAPI } from '@/lib/api/article-service'
import { newsAPI } from '@/lib/api/news-service'

export async function checkForUpdates() {
  const lastUpdate = await prisma.marketData.findFirst({
    orderBy: {
      timestamp: 'desc'
    },
    select: {
      timestamp: true
    }
  })

  const now = new Date()
  const lastUpdateTime = lastUpdate?.timestamp
  const needsUpdate = !lastUpdateTime || 
    (now.getTime() - lastUpdateTime.getTime()) > 60 * 60 * 1000 // 1 hora

  return {
    lastUpdate: lastUpdateTime,
    needsUpdate
  }
}

export async function updateCrypto() {
  try {
    const cryptos = await cryptoAPI.getTopCryptos()
    
    // Guardar los datos en la base de datos
    for (const crypto of cryptos) {
      await prisma.marketData.create({
        data: crypto
      })
    }

    // Revalidar todas las rutas de una vez
    revalidatePath('/', 'layout') // Esto revalidará todas las rutas bajo '/'

    return { success: true }
  } catch (error) {
    console.error('Error updating crypto data:', error)
    throw error
  }
}

export async function updateArticle() {
  try {
    // Obtener datos necesarios para el artículo
    const [cryptoData, newsArticles] = await Promise.all([
      prisma.marketData.findMany({
        where: {
          type: 'CRYPTO'
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['symbol']
      }),
      newsAPI.getCryptoNews()
    ])

    // Generar y guardar el artículo
    const content = await articleAPI.generateArticle(cryptoData, newsArticles)
    await prisma.article.create({
      data: {
        content: content.html
      }
    })

    // La revalidación del layout ya incluirá esta ruta
    return { success: true }
  } catch (error) {
    console.error('Error updating article:', error)
    throw error
  }
} 