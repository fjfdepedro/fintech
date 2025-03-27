/*
  Warnings:

  - You are about to drop the `ApiLimit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ApiLimit";

-- DropTable
DROP TABLE "MarketData";

-- CreateTable
CREATE TABLE "marketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "volume" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apiLimit" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apiLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketData_symbol_type_timestamp_idx" ON "marketData"("symbol", "type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "apiLimit_apiName_key" ON "apiLimit"("apiName");
