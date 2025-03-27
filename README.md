# Fintech Dashboard

A comprehensive financial dashboard built with Next.js 14, TypeScript, and Prisma, featuring real-time cryptocurrency data, market analysis, and AI-powered insights.

## Features

### Market Data
- Real-time cryptocurrency price tracking
- 24-hour price changes and volume data
- Market cap information
- Historical price charts (7-day view)
- Top cryptocurrencies ranking table

### AI-Powered Analysis
- Daily AI-generated cryptocurrency market analysis
- Professional financial insights using Qwen AI
- Automatic article generation based on latest market data
- Cached articles to prevent redundant API calls

### Portfolio Management
- Create and manage multiple portfolios
- Track your cryptocurrency holdings
- Real-time portfolio value updates
- Portfolio performance metrics

### Watchlist
- Create custom watchlists for different cryptocurrencies
- Track multiple cryptocurrencies in real-time
- Quick access to your favorite assets

### Technical Features
- Server-side rendering with Next.js 14
- Real-time updates with React Server Components
- Type-safe database operations with Prisma
- PostgreSQL database with Supabase
- Rate limiting for API endpoints
- Responsive design with Tailwind CSS
- Modern UI components with Shadcn UI

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Supabase)
- **AI**: Qwen AI via OpenRouter API
- **Authentication**: NextAuth.js
- **Data Sources**: CoinGecko API

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in the required environment variables:
- Database URLs (Supabase)
- API keys (CoinGecko, Qwen)
- NextAuth configuration

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Market Data
- `/api/crypto` - Get latest cryptocurrency data
- `/api/crypto/history` - Get historical price data

### Articles
- `/api/articles` - Get or generate daily market analysis

### Portfolios
- `/api/portfolios` - Manage user portfolios
- `/api/watchlists` - Manage user watchlists

## Database Schema

### Models
- User
- Portfolio
- Watchlist
- Symbol
- MarketData
- Article
- ApiLimit

## Rate Limiting

The application implements rate limiting for API endpoints to prevent abuse:
- Default limit: 100 requests per minute
- Configurable via environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Examples

### OpenRouter API Call Example
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "qwen/qwq-32b:free",
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
}'
```

### CoinGecko API Example
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false" \
  -H "accept: application/json"
```