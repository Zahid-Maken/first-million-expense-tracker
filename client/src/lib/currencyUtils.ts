// Currency utility functions

// Interface for Currency objects
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// List of supported currencies
export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$"},
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛" }
];

// Exchange rates relative to USD (1 USD = X units of currency)
// These are approximate and should be updated regularly in a production app
export const exchangeRates: Record<string, number> = {
  "USD": 1,
  "EUR": 0.92,
  "GBP": 0.79,
  "JPY": 149.5,
  "CNY": 7.2,
  "INR": 83.1,
  "PKR": 278.5,
  "AUD": 1.52,
  "CAD": 1.37,
  "CHF": 0.9,
  "SGD": 1.34,
  "HKD": 7.81,
  "NZD": 1.64,
  "KRW": 1345,
  "BRL": 5.05,
  "ZAR": 18.2,
  "MXN": 16.8,
  "NOK": 10.5,
  "RUB": 91.5,
  "TRY": 32.1,
  "THB": 35.8,
  "IDR": 15700,
  "PHP": 56.4,
  "MYR": 4.65,
  "AED": 3.67,
  "KHR": 4100
};

// Convert amount from USD to target currency
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = exchangeRates[targetCurrency] || 1;
  return Math.round(amountUSD * rate);
}

// Get user's selected currency code from localStorage
export function getUserCurrencyCode(): string {
  const savedCurrency = localStorage.getItem("firstMillionCurrency");
  return savedCurrency || "USD"; // Default to USD if not set
}

// Get user's selected currency object
export function getUserCurrency(): Currency {
  const currencyCode = getUserCurrencyCode();
  const currency = currencies.find(c => c.code === currencyCode);
  return currency || currencies[0]; // Default to first currency if not found
}

// Get currency symbol for display
export function getCurrencySymbol(): string {
  const currency = getUserCurrency();
  return currency.symbol;
}

// Format number with currency symbol
export function formatCurrency(amount: number | string): string {
  const currency = getUserCurrency();
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${currency.symbol} 0`;
  }
  
  const isNegative = numericAmount < 0;
  const absoluteValue = Math.abs(numericAmount);
  
  // Format with commas for thousands
  const formattedAmount = absoluteValue.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return isNegative ? `-${currency.symbol} ${formattedAmount}` : `${currency.symbol} ${formattedAmount}`;
}

// Format large numbers more readably (e.g., $1.2M)
export function formatLargeCurrency(amount: number | string): string {
  const currency = getUserCurrency();
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${currency.symbol} 0`;
  }
  
  const symbol = currency.symbol;
  const isNegative = numericAmount < 0;
  const absoluteValue = Math.abs(numericAmount);
  let formatted = '';
  
  if (absoluteValue >= 1000000000000000) { // Quadrillion (10^15)
    formatted = `${(absoluteValue / 1000000000000000).toFixed(1)}Q`;
  } else if (absoluteValue >= 1000000000000) { // Trillion (10^12)
    formatted = `${(absoluteValue / 1000000000000).toFixed(1)}T`;
  } else if (absoluteValue >= 1000000000) { // Billion (10^9)
    formatted = `${(absoluteValue / 1000000000).toFixed(1)}B`;
  } else if (absoluteValue >= 1000000) { // Million (10^6)
    formatted = `${(absoluteValue / 1000000).toFixed(1)}M`;
  } else if (absoluteValue >= 1000) { // Thousand (10^3)
    formatted = `${(absoluteValue / 1000).toFixed(1)}K`;
  } else {
    formatted = absoluteValue.toFixed(0);
  }
  
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

// Smart format - chooses between regular and large format based on number size
export function smartFormatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return formatCurrency(0);
  }
  
  // Use large format for numbers >= 1 million
  if (Math.abs(numericAmount) >= 1000000) {
    return formatLargeCurrency(numericAmount);
  }
  
  // Use regular format for smaller numbers
  return formatCurrency(numericAmount);
} 