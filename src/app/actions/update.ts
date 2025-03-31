'use server'

import prisma from '@/lib/prisma'

export async function checkForUpdates() {
  try {
    const lastRecord = await prisma.marketData.findFirst({
      orderBy: { timestamp: 'desc' }
    })
    
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const needsUpdate = !lastRecord || lastRecord.timestamp < oneHourAgo
    
    return {
      lastUpdate: lastRecord?.timestamp,
      needsUpdate
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return {
      lastUpdate: null,
      needsUpdate: true
    }
  }
}

export async function updateCrypto() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cron/update-crypto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  } catch (error) {
    console.error('Error updating crypto:', error)
    throw error
  }
}

export async function updateArticle() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cron/update-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  } catch (error) {
    console.error('Error updating article:', error)
    throw error
  }
} 