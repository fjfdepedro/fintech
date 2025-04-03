import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Increase the connection pool settings
    connection: {
      pool: {
        min: 0,
        max: 8,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
