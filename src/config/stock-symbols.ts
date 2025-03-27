export const STOCK_SYMBOLS = {
  AAPL: 'Apple Inc.',
  GOOGL: 'Alphabet Inc.',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla Inc.',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  WMT: 'Walmart Inc.'
} as const;

export type StockSymbol = keyof typeof STOCK_SYMBOLS;
