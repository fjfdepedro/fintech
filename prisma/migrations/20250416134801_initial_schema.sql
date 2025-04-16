-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."SymbolType" AS ENUM ('STOCK', 'CRYPTO', 'ETF', 'FOREX');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Symbol" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "type" "public"."SymbolType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "volume" TEXT NOT NULL,
    "market_cap" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo_url" TEXT,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apiLimit" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apiLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Article" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CryptoMarketMetadata" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "category" TEXT,
    "website_url" TEXT,
    "tech_doc_url" TEXT,
    "source_code_url" TEXT,
    "total_market_cap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_volume_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "btc_dominance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eth_dominance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active_cryptos" INTEGER NOT NULL DEFAULT 0,
    "active_exchanges" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cryptoMarketMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cache" (
    "key" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cache_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."CryptoDetails" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExchangeData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "tickers" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnChainData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnChainData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessariMetrics" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessariMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DefiProtocolData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefiProtocolData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_SymbolToWatchlist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SymbolToWatchlist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PortfolioToSymbol" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PortfolioToSymbol_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "MarketData_symbol_timestamp_idx" ON "public"."MarketData"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "apiLimit_apiName_key" ON "public"."apiLimit"("apiName");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "public"."Article"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cryptoMarketMetadata_symbol_key" ON "public"."CryptoMarketMetadata"("symbol");

-- CreateIndex
CREATE INDEX "cryptoMarketMetadata_symbol_idx" ON "public"."CryptoMarketMetadata"("symbol");

-- CreateIndex
CREATE INDEX "cryptoMarketMetadata_timestamp_idx" ON "public"."CryptoMarketMetadata"("timestamp");

-- CreateIndex
CREATE INDEX "Cache_timestamp_idx" ON "public"."Cache"("timestamp");

-- CreateIndex
CREATE INDEX "CryptoDetails_symbol_timestamp_idx" ON "public"."CryptoDetails"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "ExchangeData_symbol_timestamp_idx" ON "public"."ExchangeData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "OnChainData_symbol_timestamp_idx" ON "public"."OnChainData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "MessariMetrics_symbol_timestamp_idx" ON "public"."MessariMetrics"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "DefiProtocolData_symbol_timestamp_idx" ON "public"."DefiProtocolData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "_SymbolToWatchlist_B_index" ON "public"."_SymbolToWatchlist"("B");

-- CreateIndex
CREATE INDEX "_PortfolioToSymbol_B_index" ON "public"."_PortfolioToSymbol"("B");

-- AddForeignKey
ALTER TABLE "public"."Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SymbolToWatchlist" ADD CONSTRAINT "_SymbolToWatchlist_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SymbolToWatchlist" ADD CONSTRAINT "_SymbolToWatchlist_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PortfolioToSymbol" ADD CONSTRAINT "_PortfolioToSymbol_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PortfolioToSymbol" ADD CONSTRAINT "_PortfolioToSymbol_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

