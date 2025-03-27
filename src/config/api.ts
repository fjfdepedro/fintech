export const API_CONFIG = {
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co/query',
    API_KEY: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
  },
  FINNHUB: {
    BASE_URL: 'https://finnhub.io/api/v1',
    API_KEY: process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  },
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3'
  },
  MARKETSTACK: {
    BASE_URL: 'http://api.marketstack.com/v1',
    API_KEY: process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY
  }
}
