import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Optimize Prisma configuration for production
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn'] // Only errors and warnings in production
    : ['query', 'error', 'warn'], // All logs in development
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
