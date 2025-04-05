-- CreateEnum
CREATE TYPE "SymbolType" AS ENUM ('STOCK', 'CRYPTO', 'ETF', 'FOREX');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symbol" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "type" "SymbolType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "apiLimit" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apiLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoMarketMetadata" (
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
CREATE TABLE "_SymbolToWatchlist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SymbolToWatchlist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PortfolioToSymbol" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PortfolioToSymbol_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "apiLimit_apiName_key" ON "apiLimit"("apiName");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cryptoMarketMetadata_symbol_key" ON "CryptoMarketMetadata"("symbol");

-- CreateIndex
CREATE INDEX "cryptoMarketMetadata_symbol_idx" ON "CryptoMarketMetadata"("symbol");

-- CreateIndex
CREATE INDEX "cryptoMarketMetadata_timestamp_idx" ON "CryptoMarketMetadata"("timestamp");

-- CreateIndex
CREATE INDEX "_SymbolToWatchlist_B_index" ON "_SymbolToWatchlist"("B");

-- CreateIndex
CREATE INDEX "_PortfolioToSymbol_B_index" ON "_PortfolioToSymbol"("B");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SymbolToWatchlist" ADD CONSTRAINT "_SymbolToWatchlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SymbolToWatchlist" ADD CONSTRAINT "_SymbolToWatchlist_B_fkey" FOREIGN KEY ("B") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioToSymbol" ADD CONSTRAINT "_PortfolioToSymbol_A_fkey" FOREIGN KEY ("A") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioToSymbol" ADD CONSTRAINT "_PortfolioToSymbol_B_fkey" FOREIGN KEY ("B") REFERENCES "Symbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

