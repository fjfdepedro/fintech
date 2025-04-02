# CryptoToday

A comprehensive financial dashboard built with Next.js 14, TypeScript, and Prisma, featuring real-time cryptocurrency data, market analysis, and AI-powered insights.

## Features

### Real-time Data & Auto-Updates
- Hourly automatic updates of cryptocurrency data from CoinGecko API
- AI-powered market analysis using QWen API
- Incremental Static Regeneration (ISR) with smart caching
- Automatic retry mechanism for failed updates

### Technical Implementation

#### 1. Automatic Revalidation (ISR)
```typescript
// In src/app/page.tsx and layout.tsx
export const revalidate = 3600 // Hourly revalidation
```

#### 2. Auto-Update System
```typescript
// Components and hooks working together
AutoUpdater -> useAutoUpdate -> Update Actions -> Revalidation
```

#### 3. Update Flow
```typescript
// Hourly checks for:
- Cryptocurrency data updates
- Market analysis generation
- Cache revalidation
```

#### 4. Error Handling & Reliability
- Maximum 3 retry attempts
- 5-minute intervals between retries
- Comprehensive error logging
- Automatic recovery mechanisms

### Cache Management
```typescript
// Optimized Vercel CDN Headers
headers: {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
}
```

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