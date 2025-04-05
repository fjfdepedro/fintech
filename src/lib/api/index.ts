import axios from 'axios'

// Base URLs for different APIs
const NEWS_API_BASE_URL = 'https://newsapi.org/v2'
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

// API clients
export const newsApiClient = axios.create({
  baseURL: NEWS_API_BASE_URL,
  params: {
    apiKey: process.env.NEWS_API_KEY
  }
})

export const coingeckoClient = axios.create({
  baseURL: COINGECKO_BASE_URL
})
