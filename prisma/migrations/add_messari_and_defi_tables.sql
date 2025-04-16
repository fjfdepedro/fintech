-- Create MessariMetrics table
CREATE TABLE IF NOT EXISTS "MessariMetrics" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessariMetrics_pkey" PRIMARY KEY ("id")
);

-- Create index for MessariMetrics
CREATE INDEX IF NOT EXISTS "MessariMetrics_symbol_timestamp_idx" ON "MessariMetrics"("symbol", "timestamp");

-- Create DefiProtocolData table
CREATE TABLE IF NOT EXISTS "DefiProtocolData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefiProtocolData_pkey" PRIMARY KEY ("id")
);

-- Create index for DefiProtocolData
CREATE INDEX IF NOT EXISTS "DefiProtocolData_symbol_timestamp_idx" ON "DefiProtocolData"("symbol", "timestamp"); 