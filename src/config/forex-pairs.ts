export const FOREX_PAIRS = {
  'EUR/USD': 'Euro / US Dollar',
  'GBP/USD': 'British Pound / US Dollar',
  'USD/JPY': 'US Dollar / Japanese Yen',
  'USD/CHF': 'US Dollar / Swiss Franc',
  'USD/CAD': 'US Dollar / Canadian Dollar',
  'AUD/USD': 'Australian Dollar / US Dollar',
  'NZD/USD': 'New Zealand Dollar / US Dollar',
  'EUR/GBP': 'Euro / British Pound',
  'EUR/JPY': 'Euro / Japanese Yen',
  'GBP/JPY': 'British Pound / Japanese Yen'
} as const;

export type ForexPair = keyof typeof FOREX_PAIRS;
