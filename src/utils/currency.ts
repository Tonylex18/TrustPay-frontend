type CurrencyCode = 'USD' | 'EUR' | 'GBP';

const DEFAULT_CURRENCY: CurrencyCode = 'USD';
const CURRENCY_STORAGE_KEY = 'trustpay.currency.preference';
const FX_CACHE_KEY = 'trustpay.fx.rates';
const FX_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

const SUPPORTED_CURRENCIES: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' }
];

const getStoredCurrency = (): CurrencyCode | null => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  const match = SUPPORTED_CURRENCIES.find((curr) => curr.code === stored);
  return match?.code || null;
};

const getStoredCurrencyOrDefault = (): CurrencyCode =>
  getStoredCurrency() || DEFAULT_CURRENCY;

const setStoredCurrency = (currency: CurrencyCode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
};

const getDefaultCurrencyForCountry = (countryCode?: string | null): CurrencyCode => {
  const country = (countryCode || '').toUpperCase();
  if (country === 'GR') return 'EUR';
  if (country === 'GB') return 'GBP';
  if (country === 'US') return 'USD';
  return DEFAULT_CURRENCY;
};

const getCachedRates = (): { base: CurrencyCode; rates: Record<string, number> } | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(FX_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      base: CurrencyCode;
      rates: Record<string, number>;
      timestamp: number;
    };
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > FX_CACHE_TTL_MS) {
      return null;
    }
    return { base: parsed.base, rates: parsed.rates };
  } catch (_err) {
    return null;
  }
};

const setCachedRates = (base: CurrencyCode, rates: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  const payload = {
    base,
    rates,
    timestamp: Date.now()
  };
  window.localStorage.setItem(FX_CACHE_KEY, JSON.stringify(payload));
};

const fetchRates = async (base: CurrencyCode = DEFAULT_CURRENCY) => {
  const apiUrl =
    import.meta.env.VITE_FX_API_URL || 'https://api.exchangerate.host/latest';
  const url = new URL(apiUrl);
  if (!url.searchParams.has('base')) {
    url.searchParams.set('base', base);
  }
  const response = await fetch(url.toString());
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Unable to load FX rates.');
  }
  const rates = payload?.rates || payload?.data?.rates;
  if (!rates) {
    throw new Error('FX response missing rates.');
  }
  return { base: (payload?.base || base) as CurrencyCode, rates };
};

const convertAmount = (
  amount: number,
  baseCurrency: string,
  targetCurrency: CurrencyCode,
  rates: Record<string, number>,
  ratesBase: CurrencyCode = DEFAULT_CURRENCY
) => {
  const base = (baseCurrency || DEFAULT_CURRENCY).toUpperCase();
  const target = targetCurrency.toUpperCase();
  if (base === target) return amount;

  const baseRate = base === ratesBase ? 1 : rates[base];
  const targetRate = target === ratesBase ? 1 : rates[target];
  if (!baseRate || !targetRate) return amount;

  return (amount / baseRate) * targetRate;
};

export type { CurrencyCode };
export {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  getStoredCurrency,
  getStoredCurrencyOrDefault,
  setStoredCurrency,
  getDefaultCurrencyForCountry,
  getCachedRates,
  setCachedRates,
  fetchRates,
  convertAmount
};
