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
import CardDetailsDisplay from '../user-profile/components/CardDetailsDisplay';
import type { DashboardData, QuickActionConfig } from './types';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';
import { toast } from 'react-toastify';

type DashboardStatus = 'pending' | 'completed' | 'failed';

type CardSummary = {
  id: string;
  brand: string;
  last4: string;
  status: string;
  bankAccountId: string;
  stripeCardId?: string;
};

type CardRequestSummary = {
  id: string;
  status: string;
  bankAccountId: string;
  accountLast4?: string;
  feeStatus?: string;
  rejectionReason?: string | null;
};

const normalizeStatus = (value: string | null | undefined): DashboardStatus => {
  const status = (value || '').toLowerCase();
  if (
    status.includes('reject') ||
    status.includes('decline') ||
    status.includes('fail') ||
    status.includes('cancel') ||
    status.includes('reverse') ||
    status === 'error'
  ) {
    return 'failed';
  }
  if (status.includes('pending') || status.includes('process') || status.includes('review')) {
    return 'pending';
  }
  return 'completed';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [cardRequests, setCardRequests] = useState<CardRequestSummary[]>([]);
  const [cardLoadError, setCardLoadError] = useState<string | null>(null);
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
      setCardLoadError(null);
      setCards([]);
      setCardRequests([]);
      try {
        const [meRes, accountsRes, kycRes, cardsRes, cardRequestsRes] = await Promise.all([
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
          fetch(`${API_BASE_URL}/cards`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/card-requests`, {
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

        const cardsPayload = await cardsRes.json().catch(() => null);
        const cardRequestsPayload = await cardRequestsRes.json().catch(() => null);
        if (!cardsRes.ok) {
          if (cardsRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          const message = cardsPayload?.errors || cardsPayload?.message || 'Unable to load cards.';
          setCardLoadError(message);
        } else if (Array.isArray(cardsPayload)) {
          setCards(
            cardsPayload.map((c: any) => ({
              id: c.id,
              brand: c.brand,
              last4: c.last4,
              status: c.status,
              bankAccountId: c.bankAccountId,
              stripeCardId: c.stripeCardId
            }))
          );
        }

        if (cardRequestsRes.ok && Array.isArray(cardRequestsPayload)) {
          setCardRequests(
            cardRequestsPayload.map((r: any) => ({
              id: r.id,
              status: r.status,
              bankAccountId: r.bankAccountId,
              accountLast4: r.accountLast4 || r.account_last4,
              feeStatus: r.feeStatus || r.fee_status,
              rejectionReason: r.rejectionReason || r.rejection_reason,
            }))
          );
        } else if (!cardRequestsRes.ok) {
          const message = cardRequestsPayload?.errors || cardRequestsPayload?.message || 'Unable to load card requests.';
          setCardLoadError((prev) => prev || message);
        }

        const accountsData = Array.isArray(accountsPayload) ? accountsPayload : [];
        const normalizedAccounts = accountsData.map((acct: any) => ({
          id: acct.id,
          type: (acct.type?.toLowerCase?.() || 'checking') as 'checking' | 'savings' | 'credit',
          balance: acct.available_balance ?? acct.posted_balance ?? acct.balance ?? 0,
          accountNumber: acct.account_number || acct.accountNumber || '',
          currency: acct.currency || 'USD',
          routingNumber: acct.routing_number || acct.routingNumber,
        }));

        setDashboardData({
          user: {
            email: meData?.email,
            name: (kyc?.firstName ? `${kyc.firstName} ${kyc.lastName || ""}` : (meData?.fullName || meData?.email || "")).trim(),
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
          const rawStatus = entry.transaction?.status ?? entry.status ?? '';
          const status = normalizeStatus(String(rawStatus));

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
        const statusPriority = { completed: 2, failed: 1, pending: 0 } as const;
        const mergedMap = new Map<string, typeof normalized[number]>();
        normalized.forEach((tx) => {
          const existing = mergedMap.get(tx.id);
          if (!existing) {
            mergedMap.set(tx.id, tx);
            return;
          }
          const nextStatus =
            statusPriority[tx.status] >= statusPriority[existing.status]
              ? tx.status
              : existing.status;
          mergedMap.set(tx.id, {
            ...existing,
            ...tx,
            status: nextStatus,
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

  const token = getStoredToken();

  const primaryAccount = useMemo(() => {
    if (!dashboardData?.primaryAccount) {
      return null;
    }
    return dashboardData.primaryAccount;
  }, [dashboardData]);

  const activeCard = useMemo(() => {
    if (!cards.length) return null;
    if (primaryAccount?.id) {
      const match = cards.find((c) => c.bankAccountId === primaryAccount.id);
      if (match) return match;
    }
    return cards[0] || null;
  }, [cards, primaryAccount?.id]);
  const activeRequest = useMemo(() => {
    const prioritized = cardRequests.find((r) => ['PENDING_APPROVAL', 'APPROVED'].includes((r.status || '').toUpperCase()));
    return prioritized || cardRequests[0] || null;
  }, [cardRequests]);

  const linkedAccount = useMemo(
    () => (activeCard ? (dashboardData?.accounts || []).find((a) => a.id === activeCard.bankAccountId) || null : null),
    [activeCard, dashboardData?.accounts]
  );
  const linkedAccountLast4 = linkedAccount?.accountNumber ? linkedAccount.accountNumber.slice(-4) : undefined;

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

  const renderRequestBadge = (status?: string) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'REJECTED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-error/10 text-error border-error/30">
          Rejected
        </span>
      );
    }
    if (normalized === 'APPROVED' || normalized === 'ISSUED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-success/10 text-success border-success/30">
          {normalized === 'ISSUED' ? 'Issued' : 'Approved'}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        Pending Approval
      </span>
    );
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
            <div className="max-w-[90%] mx-auto space-y-6">
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

                  <div className="space-y-3">
                    {cardLoadError && (
                      <div className="border border-error/30 bg-error/5 text-error text-sm rounded-lg px-3 py-2">
                        {cardLoadError}
                      </div>
                    )}
                    {activeRequest && (!activeCard || (activeRequest.status || '').toUpperCase() !== 'ISSUED') && (
                      <div className="border border-border rounded-lg p-4 bg-card/60">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Virtual Card Request</p>
                            <p className="text-xs text-muted-foreground">
                              Account ••••{activeRequest.accountLast4 || '----'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Fee status: {(activeRequest.feeStatus || 'PENDING').toString().replace(/_/g, ' ')}
                            </p>
                            {activeRequest.rejectionReason && (
                              <p className="text-xs text-error mt-1">Reason: {activeRequest.rejectionReason}</p>
                            )}
                            {(!activeRequest.rejectionReason && (activeRequest.status || '').toUpperCase() !== 'REJECTED') && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Your card request is under review. This typically takes 2–3 business days.
                              </p>
                            )}
                          </div>
                          {renderRequestBadge(activeRequest.status)}
                        </div>
                      </div>
                    )}
                    {token ? (
                      activeCard ? (
                        <CardDetailsDisplay
                          card={activeCard}
                          token={token!}
                          linkedAccountLast4={linkedAccountLast4}
                        />
                      ) : (
                        <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                          <p>Issue a virtual card from your profile to view secure card numbers.</p>
                          <p className="text-xs mt-2">
                            Virtual Card Fee: A one-time $5 issuance fee will be deducted from your balance when you apply.
                          </p>
                          <p className="text-xs">
                            Processing Time: Card requests are reviewed within 2–3 business days.
                          </p>
                        </div>
                      )
                    ) : null}
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
            <h3 className="text-lg font-semibold text-foreground">Complete your Profile</h3>
            <p className="text-sm text-muted-foreground">
              Your profile is not verified yet. Provide all necessary details to enable banking features.
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
