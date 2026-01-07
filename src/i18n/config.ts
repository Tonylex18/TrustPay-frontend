import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enCards from './locales/en/cards.json';
import enLanding from './locales/en/landing.json';
import enBusiness from './locales/en/business.json';
import enCommercial from './locales/en/commercial.json';
import enInvest from './locales/en/invest.json';
import enAbout from './locales/en/about.json';
import enDeposit from './locales/en/deposit.json';
import enKyc from './locales/en/kyc.json';
import enTransfer from './locales/en/transfer.json';
import enRegistration from './locales/en/registration.json';
import enTransaction from './locales/en/transaction.json';
import enBills from './locales/en/bills.json';
// import enTransfer from './locales/en/transfer.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frDashboard from './locales/fr/dashboard.json';
import frCards from './locales/fr/cards.json';
import frLanding from './locales/fr/landing.json';
import frBusiness from './locales/fr/business.json';
import frCommercial from './locales/fr/commercial.json';
import frInvest from './locales/fr/invest.json';
import frAbout from './locales/fr/about.json';
import frDeposit from './locales/fr/deposit.json';
import frKyc from './locales/fr/kyc.json';
import frTransfer from './locales/fr/transfer.json';
import frRegistration from './locales/fr/registration.json';
import frTransaction from './locales/fr/transaction.json';
import frBills from './locales/fr/bills.json';
// import frTransfer from './locales/fr/transfer.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esCards from './locales/es/cards.json';
import esLanding from './locales/es/landing.json';
import esBusiness from './locales/es/business.json';
import esCommercial from './locales/es/commercial.json';
import esInvest from './locales/es/invest.json';
import esAbout from './locales/es/about.json';
import esDeposit from './locales/es/deposit.json';
import esKyc from './locales/es/kyc.json';
import esTransfer from './locales/es/transfer.json';
import esRegistration from './locales/es/registration.json';
import esTransaction from './locales/es/transaction.json';
import esBills from './locales/es/bills.json';
// import esTransfer from './locales/es/transfer.json';

import deCommon from './locales/de/common.json';
import deAuth from './locales/de/auth.json';
import deDashboard from './locales/de/dashboard.json';
import deCards from './locales/de/cards.json';
import deLanding from './locales/de/landing.json';
import deBusiness from './locales/de/business.json';
import deCommercial from './locales/de/commercial.json';
import deInvest from './locales/de/invest.json';
import deAbout from './locales/de/about.json';
import deDeposit from './locales/de/deposit.json';
import deKyc from './locales/de/kyc.json';
import deTransfer from './locales/de/transfer.json';
import deRegistration from './locales/de/registration.json';
import deTransaction from './locales/de/transaction.json';
import deBills from './locales/de/bills.json';
// import deTransfer from './locales/de/transfer.json';

import elCommon from './locales/el/common.json';
import elAuth from './locales/el/auth.json';
import elDashboard from './locales/el/dashboard.json';
import elCards from './locales/el/cards.json';
import elLanding from './locales/el/landing.json';
import elBusiness from './locales/el/business.json';
import elCommercial from './locales/el/commercial.json';
import elInvest from './locales/el/invest.json';
import elAbout from './locales/el/about.json';
import elDeposit from './locales/el/deposit.json';
import elKyc from './locales/el/kyc.json';
import elTransfer from './locales/el/transfer.json';
import elRegistration from './locales/el/registration.json';
import elTransaction from './locales/el/transaction.json';
import elBills from './locales/el/bills.json';
// import elTransfer from './locales/el/transfer.json';

import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptCards from './locales/pt/cards.json';
import ptLanding from './locales/pt/landing.json';
import ptBusiness from './locales/pt/business.json';
import ptCommercial from './locales/pt/commercial.json';
import ptInvest from './locales/pt/invest.json';
import ptAbout from './locales/pt/about.json';
import ptDeposit from './locales/pt/deposit.json';
import ptKyc from './locales/pt/kyc.json';
import ptTransfer from './locales/pt/transfer.json';
import ptRegistration from './locales/pt/registration.json';
import ptTransaction from './locales/pt/transaction.json';
import ptBills from './locales/pt/bills.json';
// import ptTransfer from './locales/pt/transfer.json';

export const LANGUAGE_STORAGE_KEY = 'trustpay.language';

export const supportedLanguages = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'fr', label: 'Français', shortLabel: 'FR' },
  { code: 'es', label: 'Español', shortLabel: 'ES' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'el', label: 'Ελληνικά', shortLabel: 'EL' },
  { code: 'pt', label: 'Português', shortLabel: 'PT' }
] as const;

const fallbackLng = 'en';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    cards: enCards,
    landing: enLanding,
    business: enBusiness,
    commercial: enCommercial,
    invest: enInvest,
    about: enAbout,
    kyc: enKyc,
    deposit: enDeposit,
    transfer: enTransfer,
    registration: enRegistration,
    transaction: enTransaction,
    bills: enBills
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    cards: frCards,
    landing: frLanding,
    business: frBusiness,
    commercial: frCommercial,
    invest: frInvest,
    about: frAbout,
    kyc: frKyc,
    deposit: frDeposit,
    transfer: frTransfer,
    registration: frRegistration,
    transaction: frTransaction,
    bills: frBills
  },
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    cards: esCards,
    landing: esLanding,
    business: esBusiness,
    commercial: esCommercial,
    invest: esInvest,
    about: esAbout,
    kyc: esKyc,
    deposit: esDeposit,
    transfer: esTransfer,
    registration: esRegistration,
    transaction: esTransaction,
    bills: esBills
  },
  de: {
    common: deCommon,
    auth: deAuth,
    dashboard: deDashboard,
    cards: deCards,
    landing: deLanding,
    business: deBusiness,
    commercial: deCommercial,
    invest: deInvest,
    about: deAbout,
    kyc: deKyc,
    deposit: deDeposit,
    transfer: deTransfer,
    registration: deRegistration,
    transaction: deTransaction,
    bills: deBills
  },
  el: {
    common: elCommon,
    auth: elAuth,
    dashboard: elDashboard,
    cards: elCards,
    landing: elLanding,
    business: elBusiness,
    commercial: elCommercial,
    invest: elInvest,
    about: elAbout,
    kyc: elKyc,
    deposit: elDeposit,
    transfer: elTransfer,
    registration: elRegistration,
    transaction: elTransaction,
    bills: elBills
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    dashboard: ptDashboard,
    cards: ptCards,
    landing: ptLanding,
    business: ptBusiness,
    commercial: ptCommercial,
    invest: ptInvest,
    about: ptAbout,
    kyc: ptKyc,
    deposit: ptDeposit,
    transfer: ptTransfer,
    registration: ptRegistration,
    transaction: ptTransaction,
    bills: ptBills
  }
} as const;

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const updateDocumentLanguage = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
};

const initialLanguage = () => {
  const stored = getStoredLanguage();
  if (stored && resources[stored as keyof typeof resources]) {
    return stored;
  }
  return fallbackLng;
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage(),
    fallbackLng,
    supportedLngs: supportedLanguages.map((lang) => lang.code),
    ns: ['common', 'auth', 'dashboard', 'cards', 'landing', 'business', 'commercial', 'invest', 'about', 'kyc', 'deposit', 'transfer', 'registration', 'transaction', 'bills'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    returnObjects: true
  });

updateDocumentLanguage(i18n.language);

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {
      // Ignore persistence failures
    }
  }
  updateDocumentLanguage(lng);
});

export default i18n;
