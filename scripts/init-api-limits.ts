import prisma from '../src/lib/prisma'

async function main() {
  try {
    // Initialize NewsData.io API limit
    await prisma.apiLimit.upsert({
      where: {
        apiName: 'newsdata'
      },
      update: {},
      create: {
        apiName: 'newsdata',
        dailyLimit: 200, // Free tier limit
        requestCount: 0,
        lastReset: new Date()
      }
    })

    console.log('API limits initialized successfully')
  } catch (error) {
    console.error('Error initializing API limits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 