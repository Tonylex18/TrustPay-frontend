import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const MoneyTransfer = () => {
  const navigate = useNavigate();
  const verifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [userAccount, setUserAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toInternalAccountId, setToInternalAccountId] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [transferError, setTransferError] = useState<string | null>(null);

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
          routingNumber: acct.routing_number || acct.routingNumber
        }));
        setAccounts(normalized);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.transferType === 'external') {
      if (!bankLookupSuccess) {
        newErrors.accountNumber = 'Lookup bank first with holder name and routing number';
      }
      if (!formData.accountHolderName.trim()) {
        newErrors.accountNumber = 'Account holder name is required';
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = 'Enter a destination account number';
      } else if (!verifiedAccount || verifiedAccount.accountNumber !== formData.accountNumber.trim()) {
        newErrors.accountNumber = 'Please verify the account number before proceeding';
      }
      if (!formData.accountType) {
        newErrors.accountNumber = 'Select account type';
      }
      if (!formData.bankName.trim()) {
        newErrors.accountNumber = 'Bank name is required';
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

  const handleConfirmTransfer = async () => {
    setIsProcessing(true);
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
        setTransferError('Select a destination account.');
        setIsProcessing(false);
        return;
      }
      const routing =
        formData.transferType === 'internal'
          ? destinationAccount?.routingNumber || userAccount?.routingNumber || '103219840'
          : bankCode;
      if (!routing) {
        setTransferError('Missing routing number for destination account.');
        setIsProcessing(false);
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
          description: formData.memo || `Transfer to ${destinationAccount ? 'your account' : 'beneficiary'}`
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to complete transfer.';
        setTransferError(message);
        toast.error(message);
        return;
      }

      toast.success('Transfer submitted. It will complete shortly.');
      setIsConfirmationOpen(false);
      navigate('/dashboard', {
        state: {
          message: 'Transfer submitted successfully',
          type: 'success'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const maxTransferable = Math.min(
    transferLimits.perTransactionLimit,
    transferLimits.remainingToday,
    userAccount?.balance ?? transferLimits.availableBalance
  );

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
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!bankCode.trim() || !formData.accountHolderName?.trim()) {
      toast.error('Enter routing number and account holder name first.');
      return;
    }
    setIsBankLookupLoading(true);
    // Sandbox: no external lookup, accept user input
    setIsBankLookupLoading(false);
    setBankLookupSuccess(true);
    setFormData((prev) => ({ ...prev, bankName: prev.bankName || 'Sandbox Bank' }));
    toast.success('Bank identified (sandbox)');
  };

  useEffect(() => {
    if (verifyTimeout.current) {
      clearTimeout(verifyTimeout.current);
    }
    if (formData.transferType === 'external') {
      verifyTimeout.current = setTimeout(() => {
        if (bankLookupSuccess && formData.accountNumber.trim().length >= 6) {
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
        <div className="px-nav-margin py-8 max-w-6xl mx-auto">
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
                              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                              required
                            />
                            <div className="relative">
                              <Input
                                label="Routing number"
                                placeholder="Routing number"
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value)}
                                // description="Used to auto-identify bank"
                                required
                              />

                            </div>
                          </div>

                          <div className="relative">
                            <Input
                              placeholder="Bank"
                              value={formData.bankName}
                              readOnly
                              // description="Auto-filled from routing lookup"
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
                                disabled={!bankLookupSuccess}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Account Type</label>
                              <select
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                value={formData.accountType || ''}
                                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'checking' | 'savings' })}
                                disabled={!bankLookupSuccess}
                              >
                                <option value="">Select account type</option>
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
                              </select>
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
    </div>
  );
};

export default MoneyTransfer;
