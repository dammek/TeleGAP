// Currency Localization, FX Rates, and Bank Conversion Engine

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateToUsd: number; // 1 USD = X Currency
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    flag: '🇳🇬',
    rateToUsd: 1540.00,
    decimals: 0
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rateToUsd: 1.00,
    decimals: 2
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateToUsd: 0.79,
    decimals: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateToUsd: 0.92,
    decimals: 2
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rateToUsd: 1.38,
    decimals: 2
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    flag: '🇬🇭',
    rateToUsd: 15.60,
    decimals: 2
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    rateToUsd: 129.50,
    decimals: 0
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    flag: '🇿🇦',
    rateToUsd: 18.20,
    decimals: 2
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    rateToUsd: 3.67,
    decimals: 2
  },
  USDT: {
    code: 'USDT',
    symbol: '₮',
    name: 'Tether USD',
    flag: '🌐',
    rateToUsd: 1.00,
    decimals: 2
  }
};

export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '50515', name: 'Moniepoint Microfinance Bank' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '999991', name: 'PalmPay' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '032', name: 'Union Bank of Nigeria' }
];

export const DESIGNATED_PAYOUT_RAILS = [
  { id: 'NGN_NIBSS', name: 'Nigerian Naira Bank Account (NIBSS Direct)', currency: 'NGN', flag: '🇳🇬' },
  { id: 'USD_WIRE', name: 'US Dollar Bank Wire / ACH Routing', currency: 'USD', flag: '🇺🇸' },
  { id: 'GBP_FASTER', name: 'UK Faster Payments / Sort Code', currency: 'GBP', flag: '🇬🇧' },
  { id: 'EUR_SEPA', name: 'Eurozone SEPA Instant (IBAN)', currency: 'EUR', flag: '🇪🇺' },
  { id: 'USDT_CRYPTO', name: 'USDT Stablecoin (TRC20 / ERC20)', currency: 'USDT', flag: '🌐' }
];

/**
 * Detects the user's localized currency based on country, city, browser locale, or timezone.
 * Rule: Defaults to local currency of user's location, or defaults to Naira (NGN) if location cannot be determined or is not provided.
 */
export function detectUserCurrency(country?: string | null, city?: string | null): string {
  if (!country && !city) {
    // Check browser locale and timezone
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lowerTz = timeZone.toLowerCase();
      
      if (lowerTz.includes('lagos') || lowerTz.includes('nigeria') || lowerTz.includes('west_africa')) {
        return 'NGN';
      }
      if (lowerTz.includes('london') || lowerTz.includes('europe/london')) {
        return 'GBP';
      }
      if (lowerTz.includes('new_york') || lowerTz.includes('chicago') || lowerTz.includes('los_angeles') || lowerTz.includes('denver') || lowerTz.includes('america')) {
        return 'USD';
      }
      if (lowerTz.includes('toronto') || lowerTz.includes('vancouver') || lowerTz.includes('edmonton')) {
        return 'CAD';
      }
      if (lowerTz.includes('accra') || lowerTz.includes('ghana')) {
        return 'GHS';
      }
      if (lowerTz.includes('nairobi') || lowerTz.includes('kenya')) {
        return 'KES';
      }
      if (lowerTz.includes('johannesburg') || lowerTz.includes('south_africa')) {
        return 'ZAR';
      }
      if (lowerTz.includes('dubai')) {
        return 'AED';
      }
      if (lowerTz.includes('berlin') || lowerTz.includes('paris') || lowerTz.includes('amsterdam') || lowerTz.includes('rome') || lowerTz.includes('madrid')) {
        return 'EUR';
      }
    } catch {
      // Fallback
    }

    // Default to Nigerian Naira if location cannot be determined or is not provided
    return 'NGN';
  }

  const str = `${country || ''} ${city || ''}`.toLowerCase();

  if (str.includes('nigeria') || str.includes('lagos') || str.includes('abuja') || str.includes('minna') || str.includes('ibadan') || str.includes('port harcourt') || str.includes('enugu') || str.includes('kano')) {
    return 'NGN';
  }
  if (str.includes('united kingdom') || str.includes('uk') || str.includes('england') || str.includes('london') || str.includes('manchester') || str.includes('scotland') || str.includes('wales')) {
    return 'GBP';
  }
  if (str.includes('united states') || str.includes('usa') || str.includes('u.s.') || str.includes('california') || str.includes('new york') || str.includes('texas') || str.includes('seattle') || str.includes('san francisco')) {
    return 'USD';
  }
  if (str.includes('canada') || str.includes('toronto') || str.includes('vancouver') || str.includes('montreal') || str.includes('ontario')) {
    return 'CAD';
  }
  if (str.includes('germany') || str.includes('france') || str.includes('berlin') || str.includes('munich') || str.includes('paris') || str.includes('netherlands') || str.includes('amsterdam') || str.includes('europe') || str.includes('ireland')) {
    return 'EUR';
  }
  if (str.includes('ghana') || str.includes('accra') || str.includes('kumasi')) {
    return 'GHS';
  }
  if (str.includes('kenya') || str.includes('nairobi') || str.includes('mombasa')) {
    return 'KES';
  }
  if (str.includes('south africa') || str.includes('johannesburg') || str.includes('cape town') || str.includes('durban')) {
    return 'ZAR';
  }
  if (str.includes('uae') || str.includes('united arab emirates') || str.includes('dubai') || str.includes('abu dhabi')) {
    return 'AED';
  }

  // Strict fallback to Naira
  return 'NGN';
}

/**
 * Converts an amount from one currency to another using the live rate table.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'NGN'
): number {
  if (!amount || isNaN(amount)) return 0;
  const from = SUPPORTED_CURRENCIES[fromCurrency.toUpperCase()] || SUPPORTED_CURRENCIES.USD;
  const to = SUPPORTED_CURRENCIES[toCurrency.toUpperCase()] || SUPPORTED_CURRENCIES.NGN;

  // Convert from source currency to base USD, then from USD to target currency
  const amountInUsd = amount / from.rateToUsd;
  const result = amountInUsd * to.rateToUsd;

  return to.decimals === 0 ? Math.round(result) : Number(result.toFixed(to.decimals));
}

/**
 * Formats an amount into localized currency display string with appropriate symbol.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'NGN',
  options?: { showCode?: boolean }
): string {
  const curr = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || SUPPORTED_CURRENCIES.NGN;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  const formattedNumber = curr.decimals === 0
    ? Math.round(num).toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: curr.decimals, maximumFractionDigits: curr.decimals });

  if (options?.showCode) {
    return `${curr.symbol}${formattedNumber} ${curr.code}`;
  }
  return `${curr.symbol}${formattedNumber}`;
}
