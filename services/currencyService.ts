import { CURRENCIES } from '../constants';

interface ExchangeRate {
  [currencyCode: string]: number;
}

let exchangeRates: ExchangeRate = {};
let lastFetched: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRate> => {
  // Check if we have cached rates that are still valid
  if (Object.keys(exchangeRates).length > 0 && Date.now() - lastFetched < CACHE_DURATION) {
    return exchangeRates;
  }

  try {
    // In a real implementation, this would call a currency API like:
    // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    // const data = await response.json();
    // exchangeRates = data.rates;

    // For now, we'll use mock data
    const mockRates: ExchangeRate = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 151.63,
      CAD: 1.36,
      AUD: 1.52,
      GHS: 12.50
    };

    exchangeRates = mockRates;
    lastFetched = Date.now();
    return exchangeRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Return default rates if API fails
    return {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 151.63,
      CAD: 1.36,
      AUD: 1.52,
      GHS: 12.50
    };
  }
};

export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;

  const rates = await fetchExchangeRates();

  // If we don't have the from currency rate, we can't convert
  if (!rates[fromCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency}`);
  }

  // If we don't have the to currency rate, we can't convert
  if (!rates[toCurrency]) {
    throw new Error(`Exchange rate not available for ${toCurrency}`);
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / rates[fromCurrency];
  const convertedAmount = amountInUSD * rates[toCurrency];

  return convertedAmount;
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.display.split(' ')[1].replace(/[()]/g, '') : currencyCode;
};