import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AmountInput from './components/AmountInput';
import TransferTypeSelector from './components/TransferTypeSelector';
import TransferSummaryCard from './components/TransferSummaryCard';
import ConfirmationModal from './components/ConfirmationModal';
import SecurityInfo from './components/SecurityInfo';
import { TransferFormData, TransferSummary, TransferLimits, Account, VerifiedAccount } from './types';
import { toast } from 'react-toastify';
import { API_BASE_URL, getStoredToken } from '../../utils/api';

type RoutingLookupResponse = {
  valid: boolean;
  routingNumber: string;
  bankName: string | null;
  internal: boolean;
  source: string;
  error?: string;
};

const MoneyTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('transfer');
  const transferFeeRate = { internal: 0.0001, external: 0.0001 } as const;
  const navState = (location.state as any) || {};
  const navHasPin = typeof navState.hasTransferPin === 'boolean' ? navState.hasTransferPin : undefined;
  const verifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routingLookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [userAccount, setUserAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toInternalAccountId, setToInternalAccountId] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [hasTransferPin, setHasTransferPin] = useState<boolean>(() => {
    const stored = sessionStorage.getItem('hasTransferPin');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    if (typeof navHasPin === 'boolean') return navHasPin;
    return true;
  });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetup, setPinSetup] = useState({ pin: '', confirmPin: '', currentPin: '' });
  const [pinSetupError, setPinSetupError] = useState<string | null>(null);
  const [pinSetupLoading, setPinSetupLoading] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [pinEntryError, setPinEntryError] = useState<string | null>(null);
  const [pinEntryLoading, setPinEntryLoading] = useState(false);

  const [formData, setFormData] = useState<TransferFormData>({
    accountNumber: '',
    bankName: '',
    accountHolderName: '',
    accountType: undefined,
    amount: '',
    transferType: 'internal',
    memo: ''
  });

  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [transferLimits, setTransferLimits] = useState<TransferLimits>({
    dailyLimit: 10000,
    remainingToday: 10000,
    spentToday: 0,
    availableBalance: 0,
    currency: 'USD'
  });

  const [bankCode, setBankCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferSummary, setTransferSummary] = useState<TransferSummary>(() => ({
    amount: 0,
    fee: 0,
    total: 0,
    processingTime: t('processing.instant')
  }));
  const [isBankLookupLoading, setIsBankLookupLoading] = useState(false);
  const [bankLookupSuccess, setBankLookupSuccess] = useState(false);
  const [bankLookupError, setBankLookupError] = useState<string | null>(null);
  const [showRoutingNumber, setShowRoutingNumber] = useState(false);

  const getLocale = () => i18n.language || 'en-US';
  const formatCurrencyValue = (value: number, currency: string = 'USD') =>
    new Intl.NumberFormat(getLocale(), { style: 'currency', currency: currency.toUpperCase() }).format(value);
  const formatNumberValue = (value: number) =>
    new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const maskRoutingNumber = (value: string) => value.replace(/\d(?=\d{4})/g, '*');

  useEffect(() => {
    if (formData.amount) {
      calculateSummary();
    }
  }, [formData.amount, formData.transferType, i18n.language]);

  useEffect(() => {
    const controller = new AbortController();
    const token = getStoredToken();

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      setIsLoadingAccount(true);
      try {
        const [accountsRes, meRes] = await Promise.all([
          fetch(`${API_BASE_URL}/accounts`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          })
        ]);

        const payload = await accountsRes.json().catch(() => null);
        const mePayload = await meRes.json().catch(() => null);
        if (meRes.ok && mePayload) {
          const meData = mePayload?.user || mePayload?.data || mePayload;
          setCurrentUser({
            name: meData?.fullName || meData?.email,
            email: meData?.email,
            avatar: meData?.avatarUrl
          });
          if (typeof meData?.dailyTransferLimit === 'number') {
            setTransferLimits((prev) => ({
              ...prev,
              dailyLimit: meData.dailyTransferLimit,
              remainingToday:
                typeof meData?.dailyTransferRemaining === 'number'
                  ? meData.dailyTransferRemaining
                  : meData.dailyTransferLimit,
              spentToday:
                typeof meData?.dailyTransferSpent === 'number'
                  ? meData.dailyTransferSpent
                  : prev.spentToday
            }));
          }
        }

        if (!accountsRes.ok) {
          return;
        }

        const list = Array.isArray(payload) ? payload : [];
        const normalized = list.map((acct: any) => ({
          id: acct.id,
          accountNumber: acct.account_number || acct.accountNumber,
          balance: acct.available_balance ?? acct.posted_balance ?? acct.balance ?? 0,
          accountType: acct.type || 'checking',
          routingNumber: acct.routing_number || acct.routingNumber,
          pinRequired: Boolean(acct.pin_required ?? acct.pinRequired ?? false)
        }));
        setAccounts(normalized);
        const requiresPin = normalized.some((acct) => acct.pinRequired);
        setHasTransferPin(!requiresPin);
        sessionStorage.setItem('hasTransferPin', (!requiresPin).toString());
        if (requiresPin) {
          setShowPinSetup(true);
        }
        if (normalized.length > 0) {
          const primary = normalized[0];
          setUserAccount(primary);
          setFromAccountId(primary.id);
          // pick opposite account as default destination if exists
          const alt = normalized.find((a) => a.id !== primary.id);
          if (alt) setToInternalAccountId(alt.id);
          setTransferLimits((prev) => ({
            ...prev,
            availableBalance: primary.balance ?? 0,
            currency: 'USD'
          }));
        }
      } finally {
        setIsLoadingAccount(false);
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    if (routingLookupTimeout.current) {
      clearTimeout(routingLookupTimeout.current);
    }

    if (formData.transferType !== 'external') {
      setBankLookupError(null);
      setBankLookupSuccess(false);
      setIsBankLookupLoading(false);
      return;
    }

    const trimmedRouting = bankCode.trim();
    setBankLookupSuccess(false);
    setBankLookupError(null);
    setVerifiedAccount(null);
    setFormData((prev) => ({ ...prev, bankName: '' }));

    if (!trimmedRouting) {
      return;
    }

    if (!/^[0-9]{9}$/.test(trimmedRouting)) {
      setBankLookupError(t('messages.error.routingInvalid'));
      return;
    }

    routingLookupTimeout.current = setTimeout(() => {
      lookupBankByRouting(trimmedRouting);
    }, 500);

    return () => {
      if (routingLookupTimeout.current) clearTimeout(routingLookupTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, formData.transferType, i18n.language]);

  const calculateSummary = () => {
    const amount = parseFloat(formData.amount) || 0;
    const fee = Math.round(amount * transferFeeRate[formData.transferType] * 100) / 100;
    const total = amount + fee;
    const processingTime =
      formData.transferType === 'internal' ? t('processing.instant') : t('processing.external');

    setTransferSummary({
      amount,
      fee,
      total,
      processingTime
    });
  };

  const lookupBankByRouting = async (routingNumber: string) => {
    setIsBankLookupLoading(true);
    setBankLookupError(null);
    setBankLookupSuccess(false);
    setVerifiedAccount(null);
    setVerifyError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/routing/lookup?routingNumber=${encodeURIComponent(routingNumber)}`
      );
      const payload: RoutingLookupResponse | null = await response.json().catch(() => null);

      if (payload?.valid && payload.bankName) {
        setBankLookupSuccess(true);
        setFormData((prev) => ({ ...prev, bankName: payload.bankName || '' }));
        return;
      }

      const message = payload?.error || t('messages.error.bankNotFound');
      setBankLookupError(message);
      setFormData((prev) => ({ ...prev, bankName: '' }));
    } catch (_err) {
      setBankLookupError(t('messages.error.bankLookupUnavailable'));
      setFormData((prev) => ({ ...prev, bankName: '' }));
    } finally {
      setIsBankLookupLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.transferType === 'external') {
      const routingNumber = bankCode.trim();
      if (!routingNumber) {
        newErrors.routingNumber = t('messages.error.routingRequired');
      } else if (!/^[0-9]{9}$/.test(routingNumber)) {
        newErrors.routingNumber = t('messages.error.routingInvalid');
      }
      if (!formData.accountHolderName.trim()) {
        newErrors.accountHolderName = t('messages.error.accountHolderRequired');
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = bankLookupError || t('messages.error.bankNameRequired');
      }
      if (!bankLookupSuccess && !formData.bankName.trim()) {
        newErrors.bankName = bankLookupError || t('messages.error.bankLookupFirst');
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = t('messages.error.accountNumberRequired');
      } else if (!verifiedAccount || verifiedAccount.accountNumber !== formData.accountNumber.trim()) {
        newErrors.accountNumber = t('messages.error.accountNumberVerify');
      }
      if (!formData.accountType) {
        newErrors.accountType = t('messages.error.accountTypeRequired');
      }
    } else {
      if (!fromAccountId) {
        newErrors.accountNumber = t('messages.error.fromAccountRequired');
      }
      if (!toInternalAccountId) {
        newErrors.accountNumber = t('messages.error.toAccountRequired');
      } else if (toInternalAccountId === fromAccountId) {
        newErrors.accountNumber = t('messages.error.toAccountDifferent');
      }
    }

    if (!formData.amount) {
      newErrors.amount = t('messages.error.amountRequired');
    } else {
      const amount = parseFloat(formData.amount);
      if (amount <= 0) {
        newErrors.amount = t('messages.error.amountPositive');
      } else if (
        userAccount &&
        amount * (1 + transferFeeRate[formData.transferType]) > userAccount.balance
      ) {
        newErrors.amount = t('messages.error.insufficientBalance');
      } else if (amount > transferLimits.remainingToday) {
        newErrors.amount = t('messages.error.dailyLimit', {
          limit: formatCurrencyValue(transferLimits.remainingToday, transferLimits.currency)
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (formData.transferType === 'internal') {
        const dest = accounts.find((a) => a.id === toInternalAccountId);
        if (dest) {
          setVerifiedAccount({
            bankName: t('labels.internalBank'),
            accountNumber: dest.accountNumber,
            fullName: currentUser?.name || t('labels.yourAccount'),
            email: currentUser?.email || '',
            currency: transferLimits.currency,
            routingNumber: dest.routingNumber || userAccount?.routingNumber || '103219840'
          });
        }
      }
      setIsConfirmationOpen(true);
    }
  };

  const openPinEntry = () => {
    if (!hasTransferPin) {
      setShowPinSetup(true);
      setTransferError(t('messages.error.pinRequired'));
      return;
    }
    setIsConfirmationOpen(false);
    setShowPinEntry(true);
    setPinEntry('');
    setPinEntryError(null);
  };

  const handleConfirmTransfer = async () => {
    // Confirmation modal confirm -> open PIN entry modal
    openPinEntry();
  };

  const submitTransferWithPin = async () => {
    setPinEntryError(null);
    if (!pinEntry || !/^[0-9]{4,6}$/.test(pinEntry)) {
      setPinEntryError(t('pinEntry.invalid'));
      return;
    }

    setIsProcessing(true);
    setPinEntryLoading(true);
    setTransferError(null);

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const destinationAccount =
        formData.transferType === 'internal'
          ? accounts.find((a) => a.id === toInternalAccountId)
          : verifiedAccount;
      if (!destinationAccount) {
        setPinEntryError(t('messages.error.destinationRequired'));
        return;
      }
      const routing =
        formData.transferType === 'internal'
          ? destinationAccount?.routingNumber || userAccount?.routingNumber || '103219840'
          : bankCode.trim();
      if (!routing) {
        setPinEntryError(t('messages.error.routingMissing'));
        return;
      }

      const defaultDescription =
        formData.memo ||
        t(formData.transferType === 'internal' ? 'messages.defaultMemoInternal' : 'messages.defaultMemoExternal');

      const response = await fetch(`${API_BASE_URL}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          from_account_id: fromAccountId ?? userAccount?.id,
          to_account_number:
            formData.transferType === 'internal'
              ? destinationAccount?.accountNumber
              : verifiedAccount?.accountNumber,
          to_routing_number: routing,
          amount: transferSummary.amount,
          description: defaultDescription,
          pin: pinEntry
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 423) {
          const message = t('messages.error.pinLocked');
          setPinEntryError(message);
          toast.error(message);
          return;
        }
        const message = payload?.errors || payload?.message || t('messages.error.transferFailed');
        setPinEntryError(message);
        toast.error(message);
        return;
      }

      if (payload?.step_up_required) {
        toast.info(t('messages.info.stepUp'));
      } else {
        toast.success(t('messages.success.transferSubmitted'));
      }
      setTransferLimits((prev) => {
        const newSpent = prev.spentToday + transferSummary.amount;
        return {
          ...prev,
          spentToday: newSpent,
          remainingToday: Math.max(prev.dailyLimit - newSpent, 0),
          availableBalance: Math.max(prev.availableBalance - transferSummary.total, 0)
        };
      });
      if (userAccount) {
        setUserAccount({
          ...userAccount,
          balance: Math.max(userAccount.balance - transferSummary.total, 0)
        });
      }
      if (fromAccountId) {
        setAccounts((prev) =>
          prev.map((acct) => {
            if (acct.id === fromAccountId) {
              return { ...acct, balance: Math.max(acct.balance - transferSummary.total, 0) };
            }
            if (formData.transferType === 'internal' && destinationAccount && acct.id === destinationAccount.id) {
              return { ...acct, balance: acct.balance + transferSummary.amount };
            }
            return acct;
          })
        );
      }
      setIsConfirmationOpen(false);
      setShowPinEntry(false);
      setPinEntry('');
      navigate('/dashboard', {
        state: {
          message: payload?.step_up_required
            ? t('messages.info.stepUp')
            : t('messages.success.transferSubmitted'),
            type: 'success',
            stepUpRequired: Boolean(payload?.step_up_required)
        }
      });
    } finally {
      setIsProcessing(false);
      setPinEntryLoading(false);
    }
  };

  const maxTransferable = Math.min(
    transferLimits.remainingToday,
    (userAccount?.balance ?? transferLimits.availableBalance) /
      (1 + transferFeeRate[formData.transferType])
  );
  const canEditExternalFields = bankLookupSuccess || Boolean(formData.bankName.trim());

  const handleVerifyAccount = async (accountNumber: string, bankName: string) => {
    // sandbox: accept input as-is
    if (accountNumber.trim().length < 6 || !bankName.trim()) {
      setVerifiedAccount(null);
      setVerifyError(t('messages.error.verifyAccountMissing'));
      return;
    }
    setVerifiedAccount({
      bankName,
      accountNumber,
      fullName: formData.accountHolderName || '',
      email: '',
      currency: transferLimits.currency,
      routingNumber: bankCode
    });
    setVerifyError(null);
  };

  const handleLookupBank = async () => {
    if (formData.transferType !== 'external') return;

    const routingNumber = bankCode.trim();
    if (!routingNumber) {
      setBankLookupError(t('messages.error.routingRequired'));
      return;
    }
    if (!/^[0-9]{9}$/.test(routingNumber)) {
      setBankLookupError(t('messages.error.routingInvalid'));
      return;
    }

    await lookupBankByRouting(routingNumber);
  };

  const handleSavePin = async () => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const targetAccountId = fromAccountId || userAccount?.id;
    if (!targetAccountId) {
      setPinSetupError(t('messages.error.fromAccountRequired'));
      return;
    }
    if (!/^[0-9]{4,6}$/.test(pinSetup.pin) || pinSetup.pin !== pinSetup.confirmPin) {
      setPinSetupError(t('pinSetup.invalid'));
      return;
    }
    setPinSetupLoading(true);
    setPinSetupError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/accounts/${targetAccountId}/set-pin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pin: pinSetup.pin,
          currentPin: pinSetup.currentPin || undefined
        })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message = payload?.errors || payload?.message || t('messages.error.pinSaveFailed');
        setPinSetupError(message);
        toast.error(message);
        return;
      }
      toast.success(t('messages.success.pinSet'));
      setHasTransferPin(true);
      sessionStorage.setItem('hasTransferPin', 'true');
      setShowPinSetup(false);
      setPinSetup({ pin: '', confirmPin: '', currentPin: '' });
      setFormData((prev) => ({ ...prev, pin: pinSetup.pin }));
    } catch (_err) {
      setPinSetupError(t('messages.error.pinSaveUnavailable'));
    } finally {
      setPinSetupLoading(false);
    }
  };

  useEffect(() => {
    if (verifyTimeout.current) {
      clearTimeout(verifyTimeout.current);
    }
    if (formData.transferType === 'external') {
      verifyTimeout.current = setTimeout(() => {
        const hasBankContext = bankLookupSuccess || Boolean(formData.bankName.trim());
        if (hasBankContext && formData.accountNumber.trim().length >= 6) {
          handleVerifyAccount(formData.accountNumber, formData.bankName);
        } else {
          setVerifiedAccount(null);
          setVerifyError(null);
        }
      }, 400);
    }

    return () => {
      if (verifyTimeout.current) clearTimeout(verifyTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountNumber, formData.bankName]);

  const breadcrumbItems = [
    { label: t('breadcrumb.dashboard'), path: '/dashboard' },
    { label: t('breadcrumb.transfer') }
  ];
  const infoItems = t('info.items', { returnObjects: true }) as string[];
  const routingNumber = userAccount?.routingNumber || '';

  useEffect(() => {
    if (formData.transferType === 'internal') {
      setBankLookupSuccess(false);
      setBankLookupError(null);
      setBankCode('');
      setVerifyError(null);
      setVerifiedAccount(null);
      setFormData((prev) => ({
        ...prev,
        accountNumber: '',
        accountHolderName: '',
        bankName: '',
        accountType: undefined
      }));
    } else {
      setToInternalAccountId(null);
    }
  }, [formData.transferType]);

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={currentUser || undefined} onNavigate={(path) => navigate(path)} />

      <main className="pt-nav-height">
        <div className="px-nav-margin py-8 max-w-7xl mx-auto">
          <BreadcrumbTrail items={breadcrumbItems} className="mb-6" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('page.title')}</h1>
            <p className="text-muted-foreground">{t('page.subtitle')}</p>
          </div>

          {isLoadingAccount && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-card text-muted-foreground">
              {t('page.loading')}
            </div>
          )}

          {!isLoadingAccount && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          {t('form.fromAccount')} <span className="text-error">*</span>
                        </label>
                        <select
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                          value={fromAccountId ?? ''}
                          onChange={(e) => {
                            const id = e.target.value;
                            setFromAccountId(id);
                            const src = accounts.find((a) => a.id === id);
                            if (src) {
                              setUserAccount(src);
                              setTransferLimits((prev) => ({
                                ...prev,
                                availableBalance: src.balance ?? 0
                              }));
                              const alt = accounts.find((a) => a.id !== id);
                              if (alt) setToInternalAccountId((prevVal) => prevVal === id ? alt.id : prevVal ?? alt.id);
                            }
                          }}
                        >
                          {accounts.map((acct) => (
                            <option key={acct.id} value={acct.id}>
                              {t(`form.accountTypeOptions.${acct.accountType}`, { defaultValue: acct.accountType })} ••••{(acct.accountNumber || '').slice(-4)} — {formatCurrencyValue(acct.balance ?? 0, transferLimits.currency)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.transferType === 'internal' ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-foreground">
                            {t('form.destinationInternal')} <span className="text-error">*</span>
                          </label>
                          <select
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                            value={toInternalAccountId ?? ''}
                            onChange={(e) => {
                              setToInternalAccountId(e.target.value);
                              setErrors({ ...errors, accountNumber: '' });
                            }}
                          >
                            <option value="">{t('form.destinationPlaceholder')}</option>
                            {accounts
                              .filter((acct) => acct.id !== fromAccountId)
                              .map((acct) => (
                                <option key={acct.id} value={acct.id}>
                                  {t(`form.accountTypeOptions.${acct.accountType}`, { defaultValue: acct.accountType })} ••••{(acct.accountNumber || '').slice(-4)}
                                </option>
                              ))}
                          </select>
                          {accounts.filter((a) => a.id !== fromAccountId).length === 0 && (
                            <p className="text-xs text-warning">{t('form.destinationWarning')}</p>
                          )}
                          {errors.accountNumber && (
                            <p className="text-xs text-error">{errors.accountNumber}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              label={t('form.accountHolderName')}
                              placeholder={t('form.accountHolderPlaceholder')}
                              value={formData.accountHolderName}
                              onChange={(e) => {
                                setFormData({ ...formData, accountHolderName: e.target.value });
                                setErrors({ ...errors, accountHolderName: '' });
                              }}
                              error={errors.accountHolderName}
                              required
                            />
                            <div className="relative">
                              <Input
                                label={t('form.routingNumber')}
                                placeholder={t('form.routingPlaceholder')}
                                value={bankCode}
                                onChange={(e) => {
                                  setBankCode(e.target.value);
                                  setErrors({ ...errors, routingNumber: '' });
                                  setBankLookupError(null);
                                }}
                                error={errors.routingNumber || bankLookupError || undefined}
                                required
                              />

                            </div>
                          </div>

                          <div className="relative">
                            <Input
                              label={t('form.bankName')}
                              placeholder={t('form.bankPlaceholder')}
                              value={formData.bankName}
                              readOnly={bankLookupSuccess}
                              onChange={(e) => {
                                if (!bankLookupSuccess) {
                                  setFormData({ ...formData, bankName: e.target.value });
                                  setErrors({ ...errors, bankName: '' });
                                }
                              }}
                              error={errors.bankName}
                              required
                            />
                            <button
                              type="button"
                              onClick={handleLookupBank}
                              className="absolute right-3 top-1/3 transform -translate-y-1/2 p-1 text-primary hover:text-primary/80 disabled:opacity-50"
                              disabled={isBankLookupLoading}
                            >
                              <Icon name={isBankLookupLoading ? 'Loader2' : 'Search'} className={isBankLookupLoading ? 'animate-spin' : ''} size={16} />
                            </button>
                          </div>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              {isVerifyingAccount && (
                                <>
                                  <Icon name="Loader2" className="animate-spin" size={16} />
                                  <span className="text-muted-foreground">{t('status.verifyingAccount')}</span>
                                </>
                              )}
                              {!isVerifyingAccount && verifiedAccount && (
                                <>
                                  <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                                  <span className="text-success">
                                    {t('status.verifiedAccount', { name: verifiedAccount.fullName })}
                                  </span>
                                </>
                              )}
                              {!isVerifyingAccount && verifyError && (
                                <>
                                  <Icon name="AlertCircle" size={16} color="var(--color-error)" />
                                <span className="text-error">{verifyError}</span>
                              </>
                            )}
                              {!isVerifyingAccount && bankLookupSuccess && !verifiedAccount && (
                                <>
                                  <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                                  <span className="text-success">{t('status.bankIdentified')}</span>
                                </>
                              )}
                              {!isVerifyingAccount && bankLookupError && (
                                <>
                                  <Icon name="AlertCircle" size={16} color="var(--color-error)" />
                                <span className="text-error">{bankLookupError}</span>
                              </>
                            )}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">{t('form.accountNumberLabel')}</label>
                              <Input
                                placeholder={t('form.accountNumberPlaceholder')}
                                value={formData.accountNumber}
                                onChange={(e) => {
                                  setFormData({ ...formData, accountNumber: e.target.value });
                                  setErrors({ ...errors, accountNumber: '' });
                                  setVerifiedAccount(null);
                                  setVerifyError(null);
                                }}
                                error={errors.accountNumber}
                                disabled={!canEditExternalFields}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">{t('form.accountTypeLabel')}</label>
                              <select
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                value={formData.accountType || ''}
                                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'checking' | 'savings' })}
                                disabled={!canEditExternalFields}
                              >
                                <option value="">{t('form.accountTypePlaceholder')}</option>
                                <option value="checking">{t('form.accountTypeOptions.checking')}</option>
                                <option value="savings">{t('form.accountTypeOptions.savings')}</option>
                              </select>
                              {errors.accountType && (
                                <p className="text-xs text-error">{errors.accountType}</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <AmountInput
                      value={formData.amount}
                      onChange={(value) => {
                        setFormData({ ...formData, amount: value });
                        setErrors({ ...errors, amount: '' });
                      }}
                      balance={userAccount?.balance ?? transferLimits.availableBalance}
                      error={errors.amount}
                      maxAmount={maxTransferable}
                      remainingDaily={transferLimits.remainingToday}
                      currency={transferLimits.currency}
                      locale={i18n.language}
                    />

                    <TransferTypeSelector
                      value={formData.transferType}
                      onChange={(value) => setFormData({ ...formData, transferType: value })}
                    />

                    <Input
                      label={t('form.memoLabel')}
                      type="text"
                      placeholder={t('form.memoPlaceholder')}
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      description={t('form.memoDescription')}
                    />

                    <div className="pt-4 border-t border-border">
                      <Button
                        type="submit"
                        variant="default"
                        size="lg"
                        iconName="Send"
                        iconPosition="left"
                        fullWidth
                        disabled={!userAccount}
                      >
                        {t('form.reviewButton')}
                      </Button>
                    </div>
                  </div>
                </form>

                {transferError && (
                  <div className="mt-4 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                    {transferError}
                  </div>
                )}

                <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} color="var(--color-primary)" className="mt-0.5 flex-shrink-0" />
                    <div>
                      {routingNumber && (
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('info.routingLabel', { defaultValue: 'Routing number' })}
                            </p>
                            <p className="text-xs font-semibold text-foreground">
                              {showRoutingNumber ? routingNumber : maskRoutingNumber(routingNumber)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRoutingNumber((prev) => !prev)}
                            className="text-xs font-medium text-primary hover:text-primary/80"
                          >
                            {showRoutingNumber
                              ? t('info.routingHide', { defaultValue: 'Hide' })
                              : t('info.routingShow', { defaultValue: 'Show' })}
                          </button>
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground mb-1">{t('info.title')}</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        {infoItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {formData.amount && !errors.amount && (
                  <TransferSummaryCard
                    summary={transferSummary}
                    transferType={formData.transferType}
                    currency={transferLimits.currency}
                    locale={i18n.language}
                  />
                )}

                <SecurityInfo limits={transferLimits} locale={i18n.language} />
              </div>
            </div>
          )}
        </div>
      </main>

      {verifiedAccount && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmTransfer}
          beneficiary={verifiedAccount}
          amount={formData.amount}
          transferType={formData.transferType}
          memo={formData.memo}
          summary={transferSummary}
          isProcessing={isProcessing}
          errorMessage={transferError}
          currency={transferLimits.currency}
          locale={i18n.language}
        />
      )}

      {showPinEntry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('pinEntry.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('pinEntry.description')}</p>
            <Input
              label={t('pinEntry.label')}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinEntry}
              onChange={(e) => setPinEntry(e.target.value.trim())}
              error={pinEntryError || undefined}
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowPinEntry(false); setPinEntry(''); setPinEntryError(null); }} disabled={pinEntryLoading}>
                {t('pinEntry.cancel')}
              </Button>
              <Button onClick={submitTransferWithPin} loading={pinEntryLoading}>
                {t('pinEntry.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPinSetup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('pinSetup.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('pinSetup.description')}
            </p>
            <div className="space-y-3">
              <Input
                label={t('pinSetup.newPin')}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinSetup.pin}
                onChange={(e) => setPinSetup((prev) => ({ ...prev, pin: e.target.value.trim() }))}
              />
              <Input
                label={t('pinSetup.confirmPin')}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinSetup.confirmPin}
                onChange={(e) => setPinSetup((prev) => ({ ...prev, confirmPin: e.target.value.trim() }))}
              />
              {hasTransferPin && (
                <Input
                  label={t('pinSetup.currentPin')}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinSetup.currentPin}
                  onChange={(e) => setPinSetup((prev) => ({ ...prev, currentPin: e.target.value.trim() }))}
                />
              )}
              {pinSetupError && (
                <div className="text-sm text-error border border-error/20 bg-error/5 rounded-md p-2">
                  {pinSetupError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPinSetup(false)} disabled={pinSetupLoading}>
                {t('pinSetup.cancel')}
              </Button>
              <Button onClick={handleSavePin} loading={pinSetupLoading}>
                {t('pinSetup.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyTransfer;
