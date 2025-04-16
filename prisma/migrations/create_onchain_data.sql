CREATE TABLE IF NOT EXISTS "OnChainData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnChainData_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OnChainData_symbol_timestamp_idx" ON "OnChainData"("symbol", "timestamp"); 