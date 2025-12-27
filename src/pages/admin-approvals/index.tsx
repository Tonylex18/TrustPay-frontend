import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select, { SelectOption } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import {
  API_BASE_URL,
  clearStoredToken,
  getStoredToken,
  setStoredToken
} from '../../utils/api';

type PendingTransaction = {
  userId: string;
  userName: string;
  userEmail: string;
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'pending' | 'completed' | 'failed';
    category: string;
    purpose?: string;
    reference?: string;
    currency?: string;
    counterparty?: string;
    note?: string;
    destinationAccountId?: string;
    beneficiaryEmail?: string;
  };
};

type KycRecord = {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  country: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
};

type CardTransaction = {
  id: string;
  cardId?: string;
  cardLast4?: string;
  cardBrand?: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  reference?: string;
  externalReference?: string;
  pendingAmount: number;
  postedAmount: number;
  description?: string;
  userEmail?: string;
  bankAccountId?: string;
  createdAt: string;
};

type MobileDepositDetail = {
  transactionId?: string | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  accountNumber?: string | null;
  userEmail?: string | null;
  amountCents?: number;
  currency?: string;
};

const testFundOptions: SelectOption[] = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' }
];

const AdminApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(getStoredToken());

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [kycRecords, setKycRecords] = useState<KycRecord[]>([]);
  const [kycStatusFilter, setKycStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [isLoadingCardTxns, setIsLoadingCardTxns] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<PendingTransaction | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycRecord | null>(null);
  const [depositDetail, setDepositDetail] = useState<MobileDepositDetail | null>(null);
  const [isLoadingDepositDetail, setIsLoadingDepositDetail] = useState(false);
  const [depositDetailError, setDepositDetailError] = useState<string | null>(null);

  const [testFundForm, setTestFundForm] = useState({
    userId: '',
    email: '',
    amount: '',
    type: 'deposit',
    note: '',
    counterparty: ''
  });
  const [isTestFundLoading, setIsTestFundLoading] = useState(false);

  const isMobileDeposit = (txn?: PendingTransaction | null) => {
    if (!txn) return false;
    const category = txn.transaction.category?.toUpperCase() || '';
    const purpose = txn.transaction.purpose?.toUpperCase() || '';
    const description = txn.transaction.description?.toUpperCase() || '';
    return (
      category.includes('MOBILE_DEPOSIT') ||
      purpose.includes('MOBILE_DEPOSIT') ||
      description.includes('MOBILE CHECK') ||
      description.includes('MOBILE DEPOSIT')
    );
  };

  const formatAmount = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (currency || 'USD').toUpperCase()
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency || 'USD'}`;
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    toast.success('Signed out successfully.');
  };

  const fetchPending = async (authToken: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/transactions?status=PENDING`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        signal
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to load pending transactions.';
        if (response.status === 401 || response.status === 403) {
          setToken(null);
        }
        setLoadError(message);
        toast.error(message);
        return;
      }

      const txns = Array.isArray(payload) ? payload : payload?.data || [];
      // Normalize to PendingTransaction shape
      const normalized: PendingTransaction[] = txns.map((t: any) => ({
        userId: t.userId || '',
        userName: t.userName || t.user?.fullName || t.user?.email || 'User',
        userEmail: t.user?.email || '—',
        transaction: {
          id: t.id,
          date: t.createdAt || t.date,
          description: t.description || t.reference || 'Pending transaction',
          amount: (t.amountCents || 0) / 100,
          type: t.type?.toLowerCase()?.includes('deposit') ? 'credit' : 'debit',
          status: 'pending',
          category: t.type,
          reference: t.reference,
          currency: t.currency || 'USD',
          counterparty: t.externalReference,
          note: t.description,
          destinationAccountId: t.destinationAccountId,
          beneficiaryEmail: t.beneficiaryEmail
        }
      }));
      setPendingTransactions(normalized);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const message = 'Unable to load pending transactions.';
        setLoadError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKyc = async (authToken: string, signal?: AbortSignal) => {
    setIsLoadingKyc(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/kyc`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to load KYC submissions.';
        if (response.status === 401 || response.status === 403) {
          setToken(null);
        }
        toast.error(message);
        return;
      }
      const list = Array.isArray(payload) ? payload : [];
      setKycRecords(list);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Unable to load KYC submissions.');
      }
    } finally {
      setIsLoadingKyc(false);
    }
  };

  const fetchCardTransactions = async (authToken: string, signal?: AbortSignal) => {
    setIsLoadingCardTxns(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/transactions`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to load card transactions.';
        if (response.status === 401 || response.status === 403) {
          setToken(null);
        }
        toast.error(message);
        return;
      }
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      setCardTransactions(list);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Unable to load card transactions.');
      }
    } finally {
      setIsLoadingCardTxns(false);
    }
  };

  const fetchMobileDepositDetail = async (transactionId: string, authToken: string) => {
    setIsLoadingDepositDetail(true);
    setDepositDetailError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/mobile-deposits?transactionId=${encodeURIComponent(transactionId)}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to load mobile deposit details.';
        setDepositDetailError(message);
        return;
      }
      const item = Array.isArray(payload) ? payload[0] : null;
      setDepositDetail(item || null);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setDepositDetailError('Unable to load mobile deposit details.');
      }
    } finally {
      setIsLoadingDepositDetail(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchPending(token, controller.signal);
    fetchKyc(token, controller.signal);
    fetchCardTransactions(token, controller.signal);
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    setDepositDetail(null);
    setDepositDetailError(null);
    if (!selectedTxn || !token) return;
    if (!isMobileDeposit(selectedTxn)) return;
    fetchMobileDepositDetail(selectedTxn.transaction.id, token);
  }, [selectedTxn, token]);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      toast.error('Email and password are required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to sign in as admin.';
        toast.error(message);
        return;
      }

      const adminToken = payload?.token || payload?.data?.token as string | undefined;
      if (!adminToken) {
        toast.error('Admin login response was incomplete.');
        return;
      }

      setStoredToken(adminToken, loginForm.rememberMe);
      setToken(adminToken);
      toast.success('Admin session started.');
    } catch (error) {
      toast.error('Unable to sign in as admin.');
    }
  };

  const handleAction = async (
    action: 'approve' | 'reject',
    item: PendingTransaction
  ) => {
    if (!token) {
      toast.error('Please sign in as an admin.');
      return;
    }

    const actionKey = `${item.transaction.id}-${action}`;
    setActiveActionId(actionKey);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/transactions/${item.transaction.id}/${action === 'approve' ? 'approve' : 'reject'}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: action === 'reject' ? JSON.stringify({ reason: 'Rejected by admin' }) : undefined
        }
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || `Unable to ${action} transaction.`;
        toast.error(message);
        return;
      }

      setPendingTransactions((prev) =>
        prev.filter((entry) => entry.transaction.id !== item.transaction.id)
      );
      setSelectedTxn((prev) => (prev?.transaction.id === item.transaction.id ? null : prev));
      toast.success(`Transaction ${action}d.`);
    } catch (error) {
      toast.error(`Unable to ${action} transaction.`);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleKycAction = async (record: KycRecord, status: 'APPROVED' | 'REJECTED') => {
    if (!token) {
      toast.error('Please sign in as an admin.');
      return;
    }
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('Enter rejection reason') || undefined;
      if (!rejectionReason) {
        toast.error('Rejection reason is required.');
        return;
      }
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/kyc/${record.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, rejectionReason })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.errors || payload?.message || 'Unable to update KYC.';
        toast.error(message);
        return;
      }
      toast.success(`KYC ${status.toLowerCase()}.`);
      setKycRecords((prev) =>
        prev.map((k) =>
          k.id === record.id ? { ...k, status, rejectionReason: rejectionReason ?? k.rejectionReason } : k
        )
      );
      setSelectedKyc((prev) => (prev?.id === record.id ? null : prev));
    } catch {
      toast.error('Unable to update KYC.');
    }
  };

  const handleTestFundSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error('Please sign in as an admin.');
      return;
    }

    const amountValue = Number(testFundForm.amount);
    if (!amountValue || amountValue <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }

    if (!testFundForm.userId && !testFundForm.email) {
      toast.error('Provide a user ID or email.');
      return;
    }

    setIsTestFundLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/test-fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: testFundForm.userId || undefined,
          email: testFundForm.email || undefined,
          amount: amountValue,
          type: testFundForm.type,
          note: testFundForm.note || undefined,
          counterparty: testFundForm.counterparty || undefined
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to create test fund entry.';
        toast.error(message);
        return;
      }

      toast.success('Test fund transaction created.');
      setTestFundForm({
        userId: '',
        email: '',
        amount: '',
        type: 'deposit',
        note: '',
        counterparty: ''
      });
      if (token) {
        fetchPending(token);
      }
    } catch (error) {
      toast.error('Unable to create test fund entry.');
    } finally {
      setIsTestFundLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Approvals - TrustPay</title>
        <meta name="description" content="Approve pending deposits, transfers, and bill payments." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-nav-margin py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="ShieldCheck" size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">TrustPay Admin</p>
                <h1 className="text-xl font-semibold text-foreground">Transaction Approvals</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              {token && (
                <Button variant="ghost" onClick={handleLogout}>
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="px-nav-margin py-10">
          {!token ? (
            <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-2">Admin sign in</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Use your admin credentials to review and approve pending transactions.
              </p>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <Input
                  label="Admin Email"
                  type="email"
                  placeholder="admin@trustpay.com"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />

                <Checkbox
                  checked={loginForm.rememberMe}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, rememberMe: event.target.checked }))
                  }
                  label="Keep me signed in"
                />

                <Button type="submit" size="lg" className="w-full">
                  Sign in as Admin
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Need an admin account?</p>
                <p className="mb-3">
                  In development you can create one via <code>POST /admin/bootstrap</code> (first admin) or with an existing admin using <code>POST /admin/users</code>, then sign in here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                    <h2 className="text-2xl font-bold text-foreground">Pending approvals</h2>
                    <p className="text-sm text-muted-foreground">
                      Review deposits, bills, and transfers before they post to customer balances.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => token && fetchPending(token)}
                    loading={isLoading}
                  >
                    Refresh
                  </Button>
                </div>

                {loadError && (
                  <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                    {loadError}
                  </div>
                )}

                {isLoading && (
                  <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    Loading pending transactions...
                  </div>
                )}

                {!isLoading && pendingTransactions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                    No pending approvals right now.
                  </div>
                )}

                <div className="space-y-4">
                  {pendingTransactions.map((item, index) => (
                    <div
                      key={item.transaction.id || item.transaction.reference || `${item.userId}-${index}`}
                      className="rounded-xl border border-border bg-card p-5 shadow-card"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{item.userName}</p>
                          <h3 className="text-lg font-semibold text-foreground">{item.transaction.description}</h3>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>{new Date(item.transaction.date).toLocaleString()}</span>
                            <span>Purpose: {item.transaction.purpose || item.transaction.category}</span>
                            <span>Reference: {item.transaction.reference || item.transaction.id}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {formatAmount(item.transaction.amount, item.transaction.currency)}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {item.transaction.currency || 'USD'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Customer</p>
                            <p>{item.userEmail}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Type</p>
                            <p>{item.transaction.type.toUpperCase()}</p>
                          </div>
                          {item.transaction.counterparty && (
                            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground">Counterparty</p>
                              <p>{item.transaction.counterparty}</p>
                            </div>
                          )}
                          {item.transaction.beneficiaryEmail && (
                            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground">Beneficiary Email</p>
                              <p>{item.transaction.beneficiaryEmail}</p>
                            </div>
                          )}
                          {item.transaction.destinationAccountId && (
                            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground">Destination Account</p>
                              <p className="break-all">{item.transaction.destinationAccountId}</p>
                            </div>
                          )}
                          {item.transaction.note && (
                            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground">Note</p>
                              <p>{item.transaction.note}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => setSelectedTxn(item)}>
                            View
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleAction('reject', item)}
                            loading={activeActionId === `${item.transaction.id}-reject`}
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleAction('approve', item)}
                            loading={activeActionId === `${item.transaction.id}-approve`}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Create test funds</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Seed a deposit, withdrawal, or transfer while running in test mode.
                  </p>
                  <form className="space-y-4" onSubmit={handleTestFundSubmit}>
                    <Input
                      label="User ID"
                      placeholder="Optional"
                      value={testFundForm.userId}
                      onChange={(event) =>
                        setTestFundForm((prev) => ({ ...prev, userId: event.target.value }))
                      }
                    />
                    <Input
                      label="User Email"
                      type="email"
                      placeholder="user@trustpay.com"
                      value={testFundForm.email}
                      onChange={(event) =>
                        setTestFundForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                    <Input
                      label="Amount"
                      type="number"
                      placeholder="0.00"
                      value={testFundForm.amount}
                      onChange={(event) =>
                        setTestFundForm((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      required
                    />
                    <Select
                      label="Type"
                      options={testFundOptions}
                      value={testFundForm.type}
                      onChange={(value) =>
                        setTestFundForm((prev) => ({ ...prev, type: String(value) }))
                      }
                      required
                    />
                    <Input
                      label="Counterparty"
                      placeholder="Optional"
                      value={testFundForm.counterparty}
                      onChange={(event) =>
                        setTestFundForm((prev) => ({ ...prev, counterparty: event.target.value }))
                      }
                    />
                    <Input
                      label="Note"
                      placeholder="Optional"
                      value={testFundForm.note}
                      onChange={(event) =>
                        setTestFundForm((prev) => ({ ...prev, note: event.target.value }))
                      }
                    />

                    <Button type="submit" size="lg" className="w-full" loading={isTestFundLoading}>
                      Create Test Fund
                    </Button>
                  </form>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">Approval rules</p>
                  <ul className="space-y-2">
                    <li>Deposits and bills settle after PaymentIntent success.</li>
                    <li>Transfers require Stripe Connect enabled for live movement.</li>
                    <li>Balances update only after admin approval.</li>
                  </ul>
                </div>
              </aside>
              </div>

              <section className="mt-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Card network activity</h2>
                    <p className="text-sm text-muted-foreground">
                      Issuing authorizations and settlements mapped to the internal ledger.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => token && fetchCardTransactions(token)} loading={isLoadingCardTxns}>
                    Refresh
                  </Button>
                </div>

                {isLoadingCardTxns ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    Loading card transactions...
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2 px-4">Card</th>
                          <th className="py-2 px-4">Amount</th>
                          <th className="py-2 px-4">Status</th>
                          <th className="py-2 px-4">Ledger</th>
                          <th className="py-2 px-4">Reference</th>
                          <th className="py-2 px-4">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {cardTransactions.map((txn) => (
                          <tr key={txn.id}>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">
                                {txn.cardBrand || 'Card'} ••••{txn.cardLast4 || '----'}
                              </div>
                              <div className="text-xs text-muted-foreground">{txn.userEmail || '—'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold">
                                {formatAmount(txn.amount, txn.currency)}
                              </div>
                              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                {txn.type}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {txn.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-muted-foreground">
                                Pending: {Number(txn.pendingAmount || 0).toFixed(2)} | Posted: {Number(txn.postedAmount || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-muted-foreground break-all">
                                {txn.reference || '—'}
                              </div>
                              {txn.externalReference && (
                                <div className="text-[11px] text-muted-foreground">Settlement: {txn.externalReference}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {new Date(txn.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cardTransactions.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4">No card authorizations or settlements found.</p>
                    )}
                  </div>
                )}
              </section>

              <section className="mt-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">KYC submissions</h2>
                    <p className="text-sm text-muted-foreground">Approve or reject identity verification submissions.</p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={kycStatusFilter}
                      onChange={(v) => setKycStatusFilter(v as any)}
                      options={[
                        { label: 'Pending', value: 'PENDING' },
                        { label: 'Approved', value: 'APPROVED' },
                        { label: 'Rejected', value: 'REJECTED' }
                      ]}
                    />
                    <Button variant="outline" onClick={() => token && fetchKyc(token)} loading={isLoadingKyc}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {isLoadingKyc ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    Loading KYC submissions...
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2 px-4">User</th>
                          <th className="py-2 px-4">Document</th>
                          <th className="py-2 px-4">Country</th>
                          <th className="py-2 px-4">Submitted</th>
                          <th className="py-2 px-4">Status</th>
                          <th className="py-2 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {kycRecords
                          .filter((k) => k.status === kycStatusFilter)
                          .map((k) => (
                            <tr key={k.id}>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{k.fullName || '—'}</div>
                                <div className="text-xs text-muted-foreground">{k.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-foreground">{k.documentType.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">{k.documentNumber}</div>
                              </td>
                              <td className="py-3 px-4">{k.country}</td>
                              <td className="py-3 px-4">{new Date(k.submittedAt).toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                  {k.status}
                                </span>
                                {k.rejectionReason && (
                                  <div className="text-[11px] text-muted-foreground mt-1">Reason: {k.rejectionReason}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedKyc(k)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={k.status !== 'PENDING'}
                                  onClick={() => handleKycAction(k, 'APPROVED')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={k.status !== 'PENDING'}
                                  onClick={() => handleKycAction(k, 'REJECTED')}
                                >
                                  Reject
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {kycRecords.filter((k) => k.status === kycStatusFilter).length === 0 && (
                      <p className="text-sm text-muted-foreground p-4">No KYC submissions for this filter.</p>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Pending Transaction</p>
                <h3 className="text-xl font-semibold text-foreground">{selectedTxn.transaction.description}</h3>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTxn(null)}>
                Close
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{selectedTxn.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTxn.userEmail}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedTxn.transaction.date).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatAmount(selectedTxn.transaction.amount, selectedTxn.transaction.currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">{selectedTxn.transaction.type.toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selectedTxn.transaction.purpose && (
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.purpose}
                    </p>
                  </div>
                )}
                {selectedTxn.transaction.reference && (
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.reference}
                    </p>
                  </div>
                )}
                {selectedTxn.transaction.counterparty && (
                  <div>
                    <p className="text-muted-foreground">Counterparty</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.counterparty}
                    </p>
                  </div>
                )}
                {selectedTxn.transaction.beneficiaryEmail && (
                  <div>
                    <p className="text-muted-foreground">Beneficiary Email</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.beneficiaryEmail}
                    </p>
                  </div>
                )}
                {selectedTxn.transaction.destinationAccountId && (
                  <div>
                    <p className="text-muted-foreground">Destination Account</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.destinationAccountId}
                    </p>
                  </div>
                )}
                {selectedTxn.transaction.note && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Note</p>
                    <p className="font-medium text-foreground break-words">
                      {selectedTxn.transaction.note}
                    </p>
                  </div>
                )}
              </div>

              {isMobileDeposit(selectedTxn) && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Check images</p>
                  {isLoadingDepositDetail && (
                    <div className="text-sm text-muted-foreground">Loading check images...</div>
                  )}
                  {depositDetailError && (
                    <div className="text-sm text-destructive">{depositDetailError}</div>
                  )}
                  {!isLoadingDepositDetail && !depositDetail && !depositDetailError && (
                    <div className="text-sm text-muted-foreground">No images found for this deposit.</div>
                  )}
                  {depositDetail && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border bg-muted/20 p-2">
                        <p className="text-xs text-muted-foreground mb-2">Front of check</p>
                        {depositDetail.frontImageUrl ? (
                          <img
                            src={depositDetail.frontImageUrl}
                            alt="Front of check"
                            className="w-full h-56 object-contain bg-white"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">Not provided</p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-2">
                        <p className="text-xs text-muted-foreground mb-2">Back of check</p>
                        {depositDetail.backImageUrl ? (
                          <img
                            src={depositDetail.backImageUrl}
                            alt="Back of check"
                            className="w-full h-56 object-contain bg-white"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">Not provided</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleAction('reject', selectedTxn)}
                  loading={activeActionId === `${selectedTxn.transaction.id}-reject`}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleAction('approve', selectedTxn)}
                  loading={activeActionId === `${selectedTxn.transaction.id}-approve`}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">KYC Submission</p>
                <h3 className="text-xl font-semibold text-foreground">{selectedKyc.fullName}</h3>
              </div>
              <Button variant="ghost" onClick={() => setSelectedKyc(null)}>
                Close
              </Button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground break-words">{selectedKyc.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedKyc.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Document Type</p>
                  <p className="font-medium text-foreground">{selectedKyc.documentType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Document Number</p>
                  <p className="font-medium text-foreground break-words">{selectedKyc.documentNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium text-foreground">{selectedKyc.country}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">{selectedKyc.status}</p>
                  {selectedKyc.rejectionReason && (
                    <span className="block text-xs text-muted-foreground">
                      Reason: {selectedKyc.rejectionReason}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedKyc.status !== 'PENDING'}
                  onClick={() => handleKycAction(selectedKyc, 'APPROVED')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={selectedKyc.status !== 'PENDING'}
                  onClick={() => handleKycAction(selectedKyc, 'REJECTED')}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminApprovalsPage;
