import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  convertAmount,
  DEFAULT_CURRENCY,
  fetchRates,
  getCachedRates,
  getDefaultCurrencyForCountry,
  getStoredCurrency,
  getStoredCurrencyOrDefault,
  setCachedRates,
  setStoredCurrency,
  type CurrencyCode
} from '../utils/currency';

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amount: number, baseCurrency?: string, locale?: string) => string;
  convert: (amount: number, baseCurrency?: string) => number;
  isRatesLoading: boolean;
  lastUpdatedAt: number | null;
  setDefaultCurrencyFromCountry: (countryCode?: string | null) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => getStoredCurrencyOrDefault());
  const [rates, setRates] = useState<Record<string, number> | null>(() => {
    const cached = getCachedRates();
    return cached?.rates || null;
  });
  const [ratesBase, setRatesBase] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const loadRates = useCallback(
    (base: CurrencyCode = DEFAULT_CURRENCY) => {
      let isActive = true;
      setIsRatesLoading(true);
      fetchRates(base)
        .then((result) => {
          if (!isActive) return;
          setRates(result.rates);
          setRatesBase(result.base);
          setCachedRates(result.base, result.rates);
          setLastUpdatedAt(Date.now());
        })
        .catch(() => {})
        .finally(() => {
          if (isActive) setIsRatesLoading(false);
        });
      return () => {
        isActive = false;
      };
    },
    []
  );

  useEffect(() => {
    const cached = getCachedRates();
    if (cached) {
      setRates(cached.rates);
      setRatesBase(cached.base);
      setLastUpdatedAt(Date.now());
      return;
    }
    const cancel = loadRates(DEFAULT_CURRENCY);
    return () => cancel();
  }, [loadRates]);

  useEffect(() => {
    if (isRatesLoading) return;
    if (!rates) {
      const cancel = loadRates(DEFAULT_CURRENCY);
      return () => cancel();
    }
    if (currency !== ratesBase && !rates[currency]) {
      const cancel = loadRates(ratesBase);
      return () => cancel();
    }
  }, [currency, rates, ratesBase, isRatesLoading, loadRates]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    setStoredCurrency(next);
  }, []);

  const setDefaultCurrencyFromCountry = useCallback((countryCode?: string | null) => {
    if (getStoredCurrency()) return;
    const fallback = getDefaultCurrencyForCountry(countryCode);
    setCurrencyState(fallback);
    setStoredCurrency(fallback);
  }, []);

  const convert = useCallback(
    (amount: number, baseCurrency?: string) => {
      if (!rates) return amount;
      return convertAmount(amount, baseCurrency || DEFAULT_CURRENCY, currency, rates, ratesBase);
    },
    [rates, currency, ratesBase]
  );

  const formatAmount = useCallback(
    (amount: number, baseCurrency?: string, locale?: string) => {
      const base = (baseCurrency || DEFAULT_CURRENCY).toUpperCase();
      const canConvert = rates && (base === currency || rates[base] || base === ratesBase);
      const effectiveCurrency = canConvert ? currency : base;
      const value = canConvert ? convert(amount, baseCurrency) : amount;
      const formatter = new Intl.NumberFormat(locale || 'en-US', {
        style: 'currency',
        currency: effectiveCurrency
      });
      return formatter.format(value);
    },
    [currency, rates, ratesBase, convert]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatAmount,
      convert,
      isRatesLoading,
      lastUpdatedAt,
      setDefaultCurrencyFromCountry
    }),
    [currency, setCurrency, formatAmount, convert, isRatesLoading, lastUpdatedAt, setDefaultCurrencyFromCountry]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
};

export { CurrencyProvider, useCurrency };
