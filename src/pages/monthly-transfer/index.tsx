import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    perTransactionLimit: 5000,
    remainingToday: 10000,
    spentToday: 0,
    availableBalance: 0,
    currency: 'USD'
  });

  const [bankCode, setBankCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferSummary, setTransferSummary] = useState<TransferSummary>({
    amount: 0,
    fee: 0,
    total: 0,
    processingTime: 'Instant'
  });
  const [isBankLookupLoading, setIsBankLookupLoading] = useState(false);
  const [bankLookupSuccess, setBankLookupSuccess] = useState(false);
  const [bankLookupError, setBankLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (formData.amount) {
      calculateSummary();
    }
  }, [formData.amount, formData.transferType]);

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
          setCurrentUser({
            name: mePayload.fullName || mePayload.email,
            email: mePayload.email,
            avatar: mePayload.avatarUrl
          });
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
      setBankLookupError('Routing number must be 9 digits');
      return;
    }

    routingLookupTimeout.current = setTimeout(() => {
      lookupBankByRouting(trimmedRouting);
    }, 500);

    return () => {
      if (routingLookupTimeout.current) clearTimeout(routingLookupTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, formData.transferType]);

  const calculateSummary = () => {
    const amount = parseFloat(formData.amount) || 0;
    const fee = formData.transferType === 'external' ? amount * 0.01 : 0;
    const total = amount + fee;
    const processingTime = formData.transferType === 'internal' ? 'Instant' : '1-2 business days';

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

      const message = payload?.error || 'Bank not found. Please double-check the routing number.';
      setBankLookupError(message);
      setFormData((prev) => ({ ...prev, bankName: '' }));
    } catch (_err) {
      setBankLookupError('Lookup unavailable. You can retry or enter the bank name manually.');
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
        newErrors.routingNumber = 'Enter a routing number';
      } else if (!/^[0-9]{9}$/.test(routingNumber)) {
        newErrors.routingNumber = 'Routing number must be 9 digits';
      }
      if (!formData.accountHolderName.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = bankLookupError || 'Bank name is required';
      }
      if (!bankLookupSuccess && !formData.bankName.trim()) {
        newErrors.bankName = bankLookupError || 'Lookup bank first with holder name and routing number';
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = 'Enter a destination account number';
      } else if (!verifiedAccount || verifiedAccount.accountNumber !== formData.accountNumber.trim()) {
        newErrors.accountNumber = 'Please verify the account number before proceeding';
      }
      if (!formData.accountType) {
        newErrors.accountType = 'Select account type';
      }
    } else {
      if (!fromAccountId) {
        newErrors.accountNumber = 'Select a source account.';
      }
      if (!toInternalAccountId) {
        newErrors.accountNumber = 'Select a destination account.';
      } else if (toInternalAccountId === fromAccountId) {
        newErrors.accountNumber = 'Choose a different destination account.';
      }
    }

    if (!formData.amount) {
      newErrors.amount = 'Please enter transfer amount';
    } else {
      const amount = parseFloat(formData.amount);
      if (amount <= 0) {
        newErrors.amount = 'Amount must be greater than zero';
      } else if (userAccount && amount > userAccount.balance) {
        newErrors.amount = 'Insufficient balance';
      } else if (amount > transferLimits.perTransactionLimit) {
        newErrors.amount = `Amount exceeds per transaction limit of $${transferLimits.perTransactionLimit.toLocaleString()}`;
      } else if (amount > transferLimits.remainingToday) {
        newErrors.amount = `Amount exceeds daily remaining limit of $${transferLimits.remainingToday.toLocaleString()}`;
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
            bankName: 'TrustPay (internal)',
            accountNumber: dest.accountNumber,
            fullName: currentUser?.name || 'Your account',
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
      setTransferError('Set your transfer PIN before sending money.');
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
      setPinEntryError('Enter your 4–6 digit transfer PIN.');
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
        setPinEntryError('Select a destination account.');
        return;
      }
      const routing =
        formData.transferType === 'internal'
          ? destinationAccount?.routingNumber || userAccount?.routingNumber || '103219840'
          : bankCode.trim();
      if (!routing) {
        setPinEntryError('Missing routing number for destination account.');
        return;
      }

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
          description: formData.memo || `Transfer to ${destinationAccount ? 'your account' : 'beneficiary'}`,
          pin: pinEntry
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 423) {
          const message = 'PIN locked, try later.';
          setPinEntryError(message);
          toast.error(message);
          return;
        }
        const message = payload?.errors || payload?.message || 'Unable to complete transfer.';
        setPinEntryError(message);
        toast.error(message);
        return;
      }

      if (payload?.step_up_required) {
        toast.info('Transfer submitted. Additional verification may be required for this amount.');
      } else {
        toast.success('Transfer submitted. It will complete shortly.');
      }
      setIsConfirmationOpen(false);
      setShowPinEntry(false);
      setPinEntry('');
      navigate('/dashboard', {
        state: {
          message: payload?.step_up_required
            ? 'Transfer submitted. Additional verification may be required.'
            : 'Transfer submitted successfully',
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
    transferLimits.perTransactionLimit,
    transferLimits.remainingToday,
    userAccount?.balance ?? transferLimits.availableBalance
  );
  const canEditExternalFields = bankLookupSuccess || Boolean(formData.bankName.trim());

  const handleVerifyAccount = async (accountNumber: string, bankName: string) => {
    // sandbox: accept input as-is
    if (accountNumber.trim().length < 6 || !bankName.trim()) {
      setVerifiedAccount(null);
      setVerifyError('Enter account number and bank name.');
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
      setBankLookupError('Enter a routing number');
      return;
    }
    if (!/^[0-9]{9}$/.test(routingNumber)) {
      setBankLookupError('Routing number must be 9 digits');
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
      setPinSetupError('Select a source account first.');
      return;
    }
    if (!/^[0-9]{4,6}$/.test(pinSetup.pin) || pinSetup.pin !== pinSetup.confirmPin) {
      setPinSetupError('Enter matching 4–6 digit PINs.');
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
        const message = payload?.errors || payload?.message || 'Unable to save PIN.';
        setPinSetupError(message);
        toast.error(message);
        return;
      }
      toast.success('Transfer PIN set.');
      setHasTransferPin(true);
      sessionStorage.setItem('hasTransferPin', 'true');
      setShowPinSetup(false);
      setPinSetup({ pin: '', confirmPin: '', currentPin: '' });
      setFormData((prev) => ({ ...prev, pin: pinSetup.pin }));
    } catch (_err) {
      setPinSetupError('Unable to save PIN right now.');
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
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Money Transfer' }
  ];

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
            <h1 className="text-3xl font-bold text-foreground mb-2">Money Transfer</h1>
            <p className="text-muted-foreground">
              Send money securely to your beneficiaries
            </p>
          </div>

          {isLoadingAccount && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-card text-muted-foreground">
              Loading account details...
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
                          From Account <span className="text-error">*</span>
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
                              {acct.accountType} ••••{(acct.accountNumber || '').slice(-4)} — ${acct.balance?.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.transferType === 'internal' ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-foreground">
                            Destination (your account) <span className="text-error">*</span>
                          </label>
                          <select
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                            value={toInternalAccountId ?? ''}
                            onChange={(e) => {
                              setToInternalAccountId(e.target.value);
                              setErrors({ ...errors, accountNumber: '' });
                            }}
                          >
                            <option value="">Select destination</option>
                            {accounts
                              .filter((acct) => acct.id !== fromAccountId)
                              .map((acct) => (
                                <option key={acct.id} value={acct.id}>
                                  {acct.accountType} ••••{(acct.accountNumber || '').slice(-4)}
                                </option>
                              ))}
                          </select>
                          {accounts.filter((a) => a.id !== fromAccountId).length === 0 && (
                            <p className="text-xs text-warning">You need another account to transfer internally.</p>
                          )}
                          {errors.accountNumber && (
                            <p className="text-xs text-error">{errors.accountNumber}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              label="Account Holder Name"
                              placeholder="Jane Doe"
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
                                label="Routing number"
                                placeholder="Routing number"
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
                              placeholder="Bank"
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
                                <span className="text-muted-foreground">Verifying account...</span>
                              </>
                            )}
                            {!isVerifyingAccount && verifiedAccount && (
                              <>
                                <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                                <span className="text-success">Verified: {verifiedAccount.fullName}</span>
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
                                <span className="text-success">Bank identified</span>
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
                              <label className="text-sm font-medium text-foreground">Account Number</label>
                              <Input
                                placeholder="Enter 10-digit account number"
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
                              <label className="text-sm font-medium text-foreground">Account Type</label>
                              <select
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                value={formData.accountType || ''}
                                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'checking' | 'savings' })}
                                disabled={!canEditExternalFields}
                              >
                                <option value="">Select account type</option>
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
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
                    />

                    <TransferTypeSelector
                      value={formData.transferType}
                      onChange={(value) => setFormData({ ...formData, transferType: value })}
                    />

                    <Input
                      label="Memo (Optional)"
                      type="text"
                      placeholder="Add a note for this transfer"
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      description="Maximum 100 characters"
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
                        Review Transfer
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
                      <p className="text-sm font-medium text-foreground mb-1">Important Information</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Internal transfers are processed instantly</li>
                        <li>External transfers may take 1-2 business days</li>
                        <li>Verify beneficiary details before confirming</li>
                        <li>Transaction cannot be reversed once confirmed</li>
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
                  />
                )}

                <SecurityInfo limits={transferLimits} />
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
        />
      )}

      {showPinEntry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Enter transfer PIN</h3>
            <p className="text-sm text-muted-foreground">
              Enter your 4–6 digit transfer PIN to authorize this transfer.
            </p>
            <Input
              label="PIN"
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
                Cancel
              </Button>
              <Button onClick={submitTransferWithPin} loading={pinEntryLoading}>
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPinSetup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Set your transfer PIN</h3>
            <p className="text-sm text-muted-foreground">
              Create a 4–6 digit PIN to authorize transfers and withdrawals. Do not share this PIN.
            </p>
            <div className="space-y-3">
              <Input
                label="New PIN"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinSetup.pin}
                onChange={(e) => setPinSetup((prev) => ({ ...prev, pin: e.target.value.trim() }))}
              />
              <Input
                label="Confirm PIN"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinSetup.confirmPin}
                onChange={(e) => setPinSetup((prev) => ({ ...prev, confirmPin: e.target.value.trim() }))}
              />
              {hasTransferPin && (
                <Input
                  label="Current PIN (if updating)"
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
                Cancel
              </Button>
              <Button onClick={handleSavePin} loading={pinSetupLoading}>
                Save PIN
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyTransfer;
