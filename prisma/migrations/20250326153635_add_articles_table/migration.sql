/*
  Warnings:

  - You are about to drop the `marketData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "marketData";

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "volume" TEXT NOT NULL,
    "market_cap" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_date_idx" ON "Article"("date");
