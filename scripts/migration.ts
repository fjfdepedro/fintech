import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear MessariMetrics
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "MessariMetrics" (
      "id" TEXT NOT NULL,
      "symbol" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "MessariMetrics_pkey" PRIMARY KEY ("id")
    );
  `
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "MessariMetrics_symbol_timestamp_idx" 
    ON "MessariMetrics"("symbol", "timestamp");
  `

  // Crear DefiProtocolData
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "DefiProtocolData" (
      "id" TEXT NOT NULL,
      "symbol" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "DefiProtocolData_pkey" PRIMARY KEY ("id")
    );
  `
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "DefiProtocolData_symbol_timestamp_idx" 
    ON "DefiProtocolData"("symbol", "timestamp");
  `

  console.log('Migración completada')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 