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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const [testFundForm, setTestFundForm] = useState({
    userId: '',
    email: '',
    amount: '',
    type: 'deposit',
    note: '',
    counterparty: ''
  });
  const [isTestFundLoading, setIsTestFundLoading] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/api/admin/transactions/pending`, {
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

      const data = (payload?.data || []) as PendingTransaction[];
      setPendingTransactions(data);
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

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchPending(token, controller.signal);
    return () => controller.abort();
  }, [token]);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      toast.error('Email and password are required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
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

      const adminToken = payload?.data?.token as string | undefined;
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
        `${API_BASE_URL}/api/admin/transactions/${item.userId}/${item.transaction.id}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
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
      toast.success(`Transaction ${action}d.`);
    } catch (error) {
      toast.error(`Unable to ${action} transaction.`);
    } finally {
      setActiveActionId(null);
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
                  In development you can create one via <code>POST /api/admin/register</code> with
                  <code>fullName</code>, <code>email</code>, and <code>password</code>, then sign in here.
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </main>
      </div>
    </>
  );
};

export default AdminApprovalsPage;
