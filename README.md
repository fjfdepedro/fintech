# CryptoToday

A comprehensive financial dashboard built with Next.js 14, TypeScript, and Prisma, featuring real-time cryptocurrency data, market analysis, and AI-powered insights.

## Features

### Real-time Data & Auto-Updates
- Automatic updates of cryptocurrency data from CoinGecko API
- AI-powered market analysis using QWen API
- Incremental Static Regeneration (ISR) with smart caching
- Automatic retry mechanism for failed updates

### Cache & Data Update System

#### 1. Cache Revalidation
```typescript
// In src/app/page.tsx
export const revalidate = 3600 // Hourly revalidation
```

#### 2. Data Update Interval
```typescript
// In src/lib/services/crypto-service.ts
const UPDATE_INTERVAL = 55 * 60 * 1000 // 55 minutes
```

#### 3. Update Flow
```typescript
// Data Update Process:
1. Page Load
   ├─> Check Cache Validity (< 1 hour)
   │   ├─> Valid: Serve from Cache
   │   └─> Invalid: Execute getCryptoData()
   │
   └─> getCryptoData()
       ├─> checkAndUpdateCryptoData()
       │   ├─> Check Last Update Time
       │   │   ├─> > 55 minutes: Update Data
       │   │   └─> ≤ 55 minutes: Use Existing Data
       │   │
       │   └─> Update Process
       │       ├─> Fetch from CoinGecko API
       │       ├─> Save to Database
       │       └─> Revalidate Cache
       │
       └─> getLatestCryptoData()
           ├─> Query Database
           ├─> Get Latest Records
           └─> Return Top 25 by Market Cap
```

#### 4. Error Handling
```typescript
// Error Recovery Process:
1. API Error
   ├─> Log Error
   ├─> Return Existing Data
   └─> Skip Cache Revalidation

2. Database Error
   ├─> Log Error
   ├─> Return Empty Array
   └─> Show Error State

3. Query Error
   ├─> Log Error
   ├─> Return Empty Array
   └─> Show Error State
```

### Technical Implementation

#### 1. Database Queries
```typescript
// Optimized Latest Data Query
const latestData = await prisma.$queryRaw<CryptoData[]>`
  WITH RankedData AS (
    SELECT *,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) as rn
    FROM "MarketData"
    WHERE type = 'CRYPTO'
  )
  SELECT * FROM RankedData 
  WHERE rn = 1
  ORDER BY market_cap DESC
  LIMIT 50
`
```

#### 2. Cache Management
```typescript
// Optimized Vercel CDN Headers
headers: {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
}
```

### Update System Details
- **Cache Duration**: 1 hour (3600 seconds) for all routes
- **Update Cycle**:
  - Cryptocurrency data updates every 55 minutes
  - Cache revalidation every hour
  - 5-minute buffer between update and revalidation
- **Protected Routes**:
  - `/api/cron/update-crypto`
  - `/api/cron/update-article`
  - `/api/revalidate`
- **Cache Invalidation**:
  - Automatic after successful updates
  - Manual revalidation available via API
  - Supports multiple paths revalidation

## Setup & Configuration

### Environment Variables
```bash
# Required environment variables
COINGECKO_API_KEY=your-coingecko-api-key
QWEN_API_KEY=your-qwen-api-key
CRON_SECRET=your-secure-secret

# Optional environment variables
DATABASE_URL=your-database-url
```

### Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## API Integration

### CoinGecko API
- Real-time cryptocurrency data
- Market prices and trends
- Hourly updates with rate limiting

### QWen API
- AI-powered market analysis
- Automated article generation
- Natural language processing

## Security Measures

### API Security
```typescript
// Server-side only environment variables
- COINGECKO_API_KEY
- QWEN_API_KEY
- CRON_SECRET

// Authentication headers
headers: {
  'Authorization': `Bearer ${CRON_SECRET}`
}
```

### Cache Revalidation Security
- Secure token validation
- Rate limiting
- Error handling

## Monitoring & Maintenance

### Vercel Dashboard
- Performance monitoring
- Error tracking
- Cache status
- API rate limits

### Update Verification
```bash
# Manual revalidation (if needed)
curl -X POST 'https://your-domain.vercel.app/api/revalidate' \
-H 'Authorization: Bearer your-CRON_SECRET' \
-H 'Content-Type: application/json' \
-d '{"path": "/"}'
```

## Architecture Overview

### Data Flow
```
1. Hourly Trigger
   └─> Auto-Update System
       ├─> CoinGecko API
       │   └─> Database Update
       │       └─> Cache Revalidation
       │
       └─> QWen API
           └─> Article Generation
               └─> Cache Revalidation
```

### Error Recovery
```
Update Attempt
└─> Success: Continue normal operation
└─> Failure: Enter retry cycle
    ├─> Wait 5 minutes
    ├─> Maximum 3 retries
    └─> Reset cycle after max attempts
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.