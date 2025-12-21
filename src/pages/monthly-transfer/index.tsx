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
        const response = await fetch(`${API_BASE_URL}/api/auth/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          return;
        }

        const data = payload?.data;
        if (!data) return;

        setCurrentUser(data.user);
        if (data.primaryAccount) {
          setUserAccount({
            id: data.primaryAccount.id,
            accountNumber: data.primaryAccount.accountNumber,
            balance: data.primaryAccount.balance,
            accountType: data.primaryAccount.type
          });
          setTransferLimits((prev) => ({
            ...prev,
            availableBalance: data.primaryAccount.balance,
            currency: data.primaryAccount.currency || prev.currency
          }));
        }
      } finally {
        setIsLoadingAccount(false);
      }
    };

    const fetchLimits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/transfer-limits`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          return;
        }
        const data = payload?.data;
        if (data) {
          setTransferLimits({
            dailyLimit: data.dailyLimit,
            perTransactionLimit: data.perTransactionLimit,
            remainingToday: data.remainingToday,
            spentToday: data.spentToday,
            availableBalance: data.availableBalance,
            currency: data.currency || 'USD'
          });
        }
      } catch (error) {
        // ignore
      }
    };

    fetchDashboard();
    fetchLimits();

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
      const response = await fetch(`${API_BASE_URL}/api/payments/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: transferSummary.total,
          currency: transferLimits.currency,
          beneficiaryName: verifiedAccount?.fullName,
          beneficiaryEmail: verifiedAccount?.email,
          accountNumber: verifiedAccount?.accountNumber,
          transferType: formData.transferType,
          memo: formData.memo
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to complete transfer.';
        setTransferError(message);
        toast.error(message);
        return;
      }

      toast.success('Transfer completed successfully.');
      setIsConfirmationOpen(false);
      navigate('/dashboard', {
        state: {
          message: 'Transfer completed successfully',
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
    const token = getStoredToken();
    if (!token || accountNumber.trim().length < 6 || !bankName.trim()) {
      setVerifiedAccount(null);
      setVerifyError(null);
      return;
    }

    setIsVerifyingAccount(true);
    setVerifyError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
          bankCode: bankCode.trim() || undefined,
          routingNumber: bankCode.trim() || undefined
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to verify account.';
        setVerifiedAccount(null);
        setVerifyError(message);
        return;
      }

      const data = payload?.data as VerifiedAccount;
      setVerifiedAccount(data);
      setVerifyError(null);
    } catch (error) {
      setVerifiedAccount(null);
      setVerifyError('Unable to verify account right now.');
    } finally {
      setIsVerifyingAccount(false);
    }
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/routing-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          routingNumber: bankCode.trim(),
          accountHolderName: formData.accountHolderName?.trim()
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to lookup bank.';
        toast.error(message);
        return;
      }
      const bankName = payload?.data?.bankName as string | undefined;
      if (bankName) {
        setFormData((prev) => ({ ...prev, bankName }));
        toast.success(`Bank identified: ${bankName}`);
        setBankLookupSuccess(true);
      } else {
        setBankLookupSuccess(false);
      }
    } finally {
      setIsBankLookupLoading(false);
    }
  };

  useEffect(() => {
    if (verifyTimeout.current) {
      clearTimeout(verifyTimeout.current);
    }
    verifyTimeout.current = setTimeout(() => {
      if (bankLookupSuccess && formData.accountNumber.trim().length >= 6) {
        handleVerifyAccount(formData.accountNumber, formData.bankName);
      } else {
        setVerifiedAccount(null);
        setVerifyError(null);
      }
    }, 400);

    return () => {
      if (verifyTimeout.current) clearTimeout(verifyTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountNumber, formData.bankName]);

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Money Transfer' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={currentUser || undefined} onNavigate={(path) => navigate(path)} />

      <main className="pt-nav-height">
        <div className="px-nav-margin py-8">
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
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-card">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Destination Account <span className="text-error">*</span>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                      <Input
                        label="Account Holder Name"
                        placeholder="e.g., Jane Doe"
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
                          description="Used to auto-identify bank"
                        />
                        
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Account Type</label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={formData.accountType || ''}
                          onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'checking' | 'savings' })}
                          disabled={!bankLookupSuccess}
                        >
                          <option value="">Select account type</option>
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                        <p className="text-xs text-muted-foreground">Requires bank lookup first</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Bank"
                        value={formData.bankName}
                        readOnly
                        description="Auto-filled from routing lookup"
                        required
                      />
                      <button
                          type="button"
                          onClick={handleLookupBank}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-primary hover:text-primary/80 disabled:opacity-50"
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
