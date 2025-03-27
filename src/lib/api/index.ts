import axios from 'axios'

// Base URLs for different APIs
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'
const NEWS_API_BASE_URL = 'https://newsapi.org/v2'
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const MARKETSTACK_BASE_URL = 'http://api.marketstack.com/v1'

// API clients
export const alphaVantageClient = axios.create({
  baseURL: ALPHA_VANTAGE_BASE_URL,
  params: {
    apikey: process.env.ALPHA_VANTAGE_API_KEY
  }
})

export const finnhubClient = axios.create({
  baseURL: FINNHUB_BASE_URL,
  params: {
    token: process.env.FINNHUB_API_KEY
  }
})

export const newsApiClient = axios.create({
  baseURL: NEWS_API_BASE_URL,
  params: {
    apiKey: process.env.NEWS_API_KEY
  }
})

export const coingeckoClient = axios.create({
  baseURL: COINGECKO_BASE_URL
})

export const marketstackClient = axios.create({
  baseURL: MARKETSTACK_BASE_URL,
  params: {
    access_key: process.env.MARKETSTACK_API_KEY
  }
})
