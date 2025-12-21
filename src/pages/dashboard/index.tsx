import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import QuickActionPanel from '../../components/ui/QuickActionPanel';
import Button from '../../components/ui/Button';
import AccountBalanceCard from './components/AccountBalanceCard';
import AccountSummaryCards from './components/AccountSummaryCards';
import RecentTransactions from './components/RecentTransactions';
import type { DashboardData, QuickActionConfig } from './types';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';
import { toast } from 'react-toastify';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings'>('checking');
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [kycRecord, setKycRecord] = useState<any>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Poll KYC status if pending
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (kycStatus === 'PENDING') {
      interval = setInterval(async () => {
        const token = getStoredToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/kyc/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const payload = await res.json().catch(() => null);
          if (res.ok && payload?.kyc) {
            const k = payload.kyc;
            setKycStatus(k.status);
            setKycRecord(k);
            if (k.status === 'APPROVED' && (!dashboardData?.accounts || dashboardData.accounts.length === 0)) {
              setShowAccountPrompt(true);
            }
          }
        } catch (_err) {
          // ignore polling errors
        }
      }, 15000); // poll every 15s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [kycStatus, dashboardData?.accounts]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = getStoredToken();

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [meRes, accountsRes, kycRes] = await Promise.all([
          fetch(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/kyc/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
        ]);

        const mePayload = await meRes.json().catch(() => null);
        if (!meRes.ok) {
          const message = mePayload?.errors || mePayload?.message || 'Unable to load dashboard data.';
          if (meRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setLoadError(message);
          toast.error(message);
          return;
        }

        const meData = mePayload?.user || mePayload?.data || mePayload;
        const kycPayload = await kycRes.json().catch(() => null);
        if (kycRes.status === 401) {
          clearStoredToken();
          navigate('/login');
          return;
        }
        const kyc = kycPayload?.kyc;
        setKycRecord(kyc);
        setKycStatus(kyc?.status || meData?.kycStatus || null);
        const accountsPayload = await accountsRes.json().catch(() => null);
        if (!accountsRes.ok) {
          const message = accountsPayload?.errors || accountsPayload?.message || 'Unable to load accounts.';
          if (accountsRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setLoadError(message);
          toast.error(message);
          return;
        }

        const accountsData = Array.isArray(accountsPayload) ? accountsPayload : [];
        const normalizedAccounts = accountsData.map((acct: any) => ({
          id: acct.id,
          type: (acct.type?.toLowerCase?.() || 'checking') as 'checking' | 'savings' | 'credit',
          balance: acct.available_balance ?? acct.posted_balance ?? acct.balance ?? 0,
          accountNumber: acct.account_number || acct.accountNumber || '',
          currency: acct.currency || 'USD',
        }));

        setDashboardData({
          user: {
            email: meData?.email,
            name: (kyc?.firstName || meData?.fullName || meData?.email || "").trim(),
          },
          accounts: normalizedAccounts,
          primaryAccount: normalizedAccounts[0] || null,
          recentTransactions: []
        });

        if (!kyc) {
          setShowKycModal(true);
        } else if (normalizedAccounts.length === 0 && kyc.status === 'APPROVED') {
          setShowAccountPrompt(true);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = 'Unable to load dashboard data.';
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [navigate]);

  // Load recent transactions for the selected primary account and merge pending->completed states
  useEffect(() => {
    const primaryId = dashboardData?.primaryAccount?.id;
    if (!primaryId) return;
    const controller = new AbortController();
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchRecentTx = async () => {
      setIsLoadingTransactions(true);
      try {
        const res = await fetch(`${API_BASE_URL}/accounts/${primaryId}/transactions?limit=25`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const payload = await res.json().catch(() => []);
        if (!res.ok) {
          if (res.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          const message = payload?.errors || payload?.message || 'Unable to load recent transactions.';
          toast.error(message);
          return;
        }

        const normalized = (Array.isArray(payload) ? payload : []).map((entry: any) => {
          const statusRaw = (entry.status || entry.transaction?.status || '').toString().toLowerCase();
          const status: "pending" | "completed" | "failed" =
            statusRaw === 'pending' ? 'pending' : 'completed';

          const txId = entry.transaction?.id || entry.transactionId || entry.id;

          return {
            id: txId,
            date: new Date(entry.created_at || entry.createdAt || entry.transaction?.createdAt || Date.now()),
            description: entry.description || entry.transaction?.description || 'Transaction',
            amount: entry.amount,
            type: ((entry.entry_type || entry.entryType || 'debit') as string).toLowerCase() as 'credit' | 'debit',
            category: entry.transaction?.type || 'Ledger',
            status
          };
        });

        // Merge by transaction id: if a pending and a completed exist, keep one row with completed status
        const mergedMap = new Map<string, typeof normalized[number]>();
        normalized.forEach((tx) => {
          const existing = mergedMap.get(tx.id);
          if (!existing) {
            mergedMap.set(tx.id, tx);
            return;
          }
          const preferCompleted = existing.status === 'completed' || tx.status === 'completed';
          mergedMap.set(tx.id, {
            ...existing,
            ...tx,
            status: preferCompleted ? 'completed' : tx.status,
            date: tx.date > existing.date ? tx.date : existing.date
          });
        });

        const merged = Array.from(mergedMap.values())
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 6);

        setDashboardData((prev) => prev ? { ...prev, recentTransactions: merged } : prev);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Unable to load recent transactions.');
        }
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchRecentTx();
    return () => controller.abort();
  }, [dashboardData?.primaryAccount?.id, navigate]);

  const primaryAccount = useMemo(() => {
    if (!dashboardData?.primaryAccount) {
      return null;
    }
    return dashboardData.primaryAccount;
  }, [dashboardData]);

  const quickActions: QuickActionConfig[] = [
    {
      label: "Deposit Money",
      icon: "ArrowDownToLine",
      onClick: () => navigate('/deposit'),
      variant: "default",
      description: "Add funds to your account"
    },
    {
      label: "Transfer Funds",
      icon: "Send",
      onClick: () => navigate('/money-transfer'),
      variant: "outline",
      description: "Send money to any account"
    },
    {
      label: "Pay Bills",
      icon: "Receipt",
      onClick: () => navigate('/bills'),
      variant: "outline",
      description: "Pay your utility bills"
    },
    {
      label: "View Transactions",
      icon: "List",
      onClick: () => navigate('/transactions'),
      variant: "secondary",
      description: "Check transaction history"
    }
  ];

  const breadcrumbItems = [
    { label: "Home", path: "/dashboard" },
    { label: "Dashboard" }
  ];

  const transferLedger = useMemo(() => {
    return (dashboardData?.recentTransactions || []).filter(
      (transaction) => transaction.category.toLowerCase() === 'transfer'
    );
  }, [dashboardData]);

  const handleCreateAccount = async () => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setCreateAccountLoading(true);
    setCreateAccountError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: newAccountType })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message = payload?.errors || payload?.message || 'Unable to create account.';
        setCreateAccountError(message);
        toast.error(message);
        return;
      }

      const account = payload;
      setDashboardData((prev) => {
        if (!prev) return prev;
        const updatedAccount = {
          id: account.id,
          type: (account.type?.toLowerCase?.() || newAccountType) as 'checking' | 'savings' | 'credit',
          balance: account.balance ?? 0,
          accountNumber: account.account_number || account.accountNumber || '',
          currency: account.currency || 'USD'
        };
        const accounts = [...(prev.accounts || []), updatedAccount];
        return {
          ...prev,
          accounts,
          primaryAccount: prev.primaryAccount || updatedAccount
        };
      });
      toast.success('Account created successfully.');
      setShowCreateModal(false);
    } catch (err) {
      setCreateAccountError('Unable to create account.');
      toast.error('Unable to create account.');
    } finally {
      setCreateAccountLoading(false);
    }
  };

  const dashboardCurrency = dashboardData?.primaryAccount?.currency || 'USD';

  const handleAccountSelect = (account: any) => {
    setDashboardData((prev) => {
      if (!prev) return prev;
      return { ...prev, primaryAccount: account };
    });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - TrustPay</title>
        <meta name="description" content="Manage your accounts, view transactions, and access banking services from your TrustPay dashboard." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <NavigationBar 
          user={dashboardData?.user ? { ...dashboardData.user, name: dashboardData.user.name || dashboardData.user.email } : undefined}
          onNavigate={(path) => navigate(path)}
        />

        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {dashboardData?.user?.name
                      ? `Welcome back, ${dashboardData.user.name.split(' ')[0]}!`
                      : 'Welcome back!'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Here's your account overview and recent activity
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  Loading your dashboard...
                </div>
              )}

              {loadError && !isLoading && (
                <div className="bg-error/5 border border-error/20 rounded-xl p-6 text-sm text-error">
                  {loadError}
                </div>
              )}

              {!isLoading && !loadError && dashboardData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {primaryAccount ? (
                      <AccountBalanceCard account={primaryAccount} />
                    ) : (
                      <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
                        No primary account found yet.
                      </div>
                    )}
                    
                    <QuickActionPanel
                      actions={quickActions}
                      title="Quick Actions"
                      description="Access your most used banking features"
                      layout="grid"
                    />

                    <RecentTransactions transactions={dashboardData.recentTransactions} />
                  </div>

                  <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        All Accounts
                      </h3>
                      <Button size="sm" variant="default" onClick={() => setShowCreateModal(true)} disabled={kycStatus !== 'APPROVED'}>
                        Create Account
                      </Button>
                    </div>
                    {dashboardData.accounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No accounts available yet.</p>
                    ) : (
                      <AccountSummaryCards accounts={dashboardData.accounts} onSelect={handleAccountSelect} />
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Payments & Bills
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="default"
                        onClick={() => navigate('/deposit')}
                        className="w-full justify-between"
                        iconName="ArrowDownToLine"
                        iconPosition="left"
                      >
                        Deposit Money
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/bills')}
                        className="w-full justify-between"
                        iconName="Receipt"
                        iconPosition="left"
                      >
                        Pay a Bill
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Transfers Ledger</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/transactions')}
                        iconName="ArrowRight"
                        iconPosition="right"
                        iconSize={16}
                      >
                        View All
                      </Button>
                    </div>
                    {transferLedger.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No transfer activity yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {transferLedger.slice(0, 4).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Intl.DateTimeFormat('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                }).format(transaction.date)}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              -{transaction.amount.toLocaleString('en-US', {
                                style: 'currency',
                                currency: dashboardCurrency
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">💡</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">
                            Financial Tip
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Consider setting up automatic transfers to your savings account to build your emergency fund consistently.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showKycModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Complete your KYC</h3>
            <p className="text-sm text-muted-foreground">
              Your profile is not verified yet. Complete KYC to enable banking features.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowKycModal(false)}>
                Later
              </Button>
              <Button onClick={() => navigate('/kyc')}>
                Go to KYC
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAccountPrompt && !showKycModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Create your first account</h3>
            <p className="text-sm text-muted-foreground">
              You are verified. Open a checking or savings account to start banking.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAccountPrompt(false)}>
                Later
              </Button>
              <Button onClick={() => { setShowAccountPrompt(false); setShowCreateModal(true); }}>
                Create Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Create Account</h3>
            <p className="text-sm text-muted-foreground">
              Choose the type of account you want to open.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 border border-border rounded-lg p-3">
                <input
                  type="radio"
                  name="accountType"
                  value="checking"
                  checked={newAccountType === 'checking'}
                  onChange={() => setNewAccountType('checking')}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Checking</p>
                  <p className="text-xs text-muted-foreground">
                    Everyday transactions and debit activity.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 border border-border rounded-lg p-3">
                <input
                  type="radio"
                  name="accountType"
                  value="savings"
                  checked={newAccountType === 'savings'}
                  onChange={() => setNewAccountType('savings')}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Savings</p>
                  <p className="text-xs text-muted-foreground">
                    Set funds aside and keep them separate.
                  </p>
                </div>
              </label>
            </div>
            {createAccountError && (
              <div className="text-sm text-error border border-error/20 bg-error/5 rounded-md p-2">
                {createAccountError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={createAccountLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} loading={createAccountLoading}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
