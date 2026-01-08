import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
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
import { apiFetch } from 'utils/apiFetch';

type DashboardStatus = 'pending' | 'completed' | 'failed';

type CardSummary = {
  id: string;
  brand: string;
  last4: string;
  status: string;
  bankAccountId: string;
  activationStatus?: string;
  activatedAt?: string;
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
  const { t } = useTranslation(['dashboard', 'common']);
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
  const [hasTransferPin, setHasTransferPin] = useState<boolean>(() => sessionStorage.getItem('hasTransferPin') === 'true');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAccountId, setPinAccountId] = useState<string | null>(null);
  const [pinForm, setPinForm] = useState({ pin: '', confirmPin: '', currentPin: '' });
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Poll KYC status if pending
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (kycStatus === 'PENDING') {
      interval = setInterval(async () => {
        const token = getStoredToken();
        if (!token) return;
        try {
          const res = await apiFetch(`${API_BASE_URL}/kyc/me`, {
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
          apiFetch(`${API_BASE_URL}/me`, {
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/accounts`, {
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/kyc/me`, {
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/cards`, {
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/card-requests`, {
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
              stripeCardId: c.stripeCardId,
              activationStatus: c.activationStatus,
              activatedAt: c.activatedAt
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
          pinRequired: Boolean(acct.pin_required ?? acct.pinRequired ?? false),
        }));

        const requiresPin = normalizedAccounts.some((acct) => acct.pinRequired);
        setHasTransferPin(!requiresPin);
        sessionStorage.setItem('hasTransferPin', (!requiresPin).toString());

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
        } else if (requiresPin) {
          setPinAccountId(normalizedAccounts[0]?.id || null);
          setShowPinModal(true);
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
        const res = await apiFetch(`${API_BASE_URL}/accounts/${primaryId}/transactions?limit=25`, {
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
      label: t('dashboard:quickActionsItems.deposit.label'),
      icon: "ArrowDownToLine",
      onClick: () => navigate('/deposit'),
      variant: "default",
      description: t('dashboard:quickActionsItems.deposit.description')
    },
    {
      label: t('dashboard:quickActionsItems.transfer.label'),
      icon: "Send",
      onClick: () => navigate('/money-transfer', { state: { hasTransferPin } }),
      variant: "outline",
      description: t('dashboard:quickActionsItems.transfer.description')
    },
    {
      label: t('dashboard:quickActionsItems.payBills.label'),
      icon: "Receipt",
      onClick: () => navigate('/bills'),
      variant: "outline",
      description: t('dashboard:quickActionsItems.payBills.description')
    },
    {
      label: t('dashboard:quickActionsItems.viewTransactions.label'),
      icon: "List",
      onClick: () => navigate('/transactions'),
      variant: "secondary",
      description: t('dashboard:quickActionsItems.viewTransactions.description')
    }
  ];

  const breadcrumbItems = [
    { label: t('dashboard:breadcrumb.home'), path: "/dashboard" },
    { label: t('dashboard:breadcrumb.dashboard') }
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
      const res = await apiFetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
          currency: account.currency || 'USD',
          pinRequired: Boolean(account.pin_required ?? account.pinRequired ?? false),
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
      if (account.pin_required) {
        setHasTransferPin(false);
        sessionStorage.setItem('hasTransferPin', 'false');
        setPinAccountId(account.id);
        setShowPinModal(true);
      } else {
        setHasTransferPin(true);
        sessionStorage.setItem('hasTransferPin', 'true');
      }
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

  const handleCardActivated = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, activationStatus: 'ACTIVE', status: 'ACTIVE' }
          : c
      )
    );
  };

  const handleSavePin = async () => {
    const targetAccountId = pinAccountId || dashboardData?.primaryAccount?.id;
    if (!targetAccountId) {
      setPinError('Select an account first.');
      return;
    }
    if (!/^[0-9]{4,6}$/.test(pinForm.pin) || pinForm.pin !== pinForm.confirmPin) {
      setPinError('Enter matching 4–6 digit PINs.');
      return;
    }
    setPinLoading(true);
    setPinError(null);
    try {
      const token = getStoredToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await apiFetch(`${API_BASE_URL}/accounts/${targetAccountId}/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pin: pinForm.pin,
          currentPin: pinForm.currentPin || undefined
        })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message = payload?.errors || payload?.message || 'Unable to save PIN.';
        setPinError(message);
        toast.error(message);
        return;
      }
      toast.success('Transfer PIN set.');
      setHasTransferPin(true);
      sessionStorage.setItem('hasTransferPin', 'true');
      setShowPinModal(false);
      setPinForm({ pin: '', confirmPin: '', currentPin: '' });
    } catch (_err) {
      setPinError('Unable to save PIN right now.');
    } finally {
      setPinLoading(false);
    }
  };

  const renderRequestBadge = (status?: string) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'REJECTED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-error/10 text-error border-error/30">
          {t('dashboard:virtualCardRequest.rejected')}
        </span>
      );
    }
    if (normalized === 'APPROVED' || normalized === 'ISSUED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-success/10 text-success border-success/30">
          {normalized === 'ISSUED' ? t('dashboard:virtualCardRequest.issued') : t('dashboard:virtualCardRequest.approved')}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        {t('dashboard:virtualCardRequest.pendingApproval')}
      </span>
    );
  };

  const firstName = dashboardData?.user?.name?.split(' ')[0];

  return (
    <>
      <Helmet>
        <title>{t('dashboard:metaTitle')}</title>
        <meta name="description" content={t('dashboard:metaDescription')} />
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
                      ? t('dashboard:welcomeWithName', { name: firstName })
                      : t('dashboard:welcome')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {t('dashboard:overview')}
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  {t('common:status.loadingDashboard')}
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
                        {t('dashboard:noPrimaryAccount')}
                      </div>
                    )}
                    
                    <QuickActionPanel
                      actions={quickActions}
                      title={t('dashboard:quickActions.title')}
                      description={t('dashboard:quickActions.description')}
                      layout="grid"
                    />

                    <RecentTransactions transactions={dashboardData.recentTransactions} />
                  </div>

                  <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t('dashboard:allAccounts')}
                      </h3>
                      <Button size="sm" variant="default" onClick={() => setShowCreateModal(true)} disabled={kycStatus !== 'APPROVED'}>
                        {t('dashboard:createAccount')}
                      </Button>
                    </div>
                    {dashboardData.accounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('dashboard:noAccounts')}</p>
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
                            <p className="text-sm font-semibold text-foreground">{t('dashboard:virtualCardRequest.title')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('dashboard:virtualCardRequest.accountLine', { last4: activeRequest.accountLast4 || '----' })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('dashboard:virtualCardRequest.feeStatus', { status: (activeRequest.feeStatus || 'PENDING').toString().replace(/_/g, ' ') })}
                            </p>
                            {activeRequest.rejectionReason && (
                              <p className="text-xs text-error mt-1">
                                {t('dashboard:virtualCardRequest.reason', { reason: activeRequest.rejectionReason })}
                              </p>
                            )}
                            {(!activeRequest.rejectionReason && (activeRequest.status || '').toUpperCase() !== 'REJECTED') && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('dashboard:virtualCardRequest.underReview')}
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
                          userEmail={dashboardData?.user?.email || ''}
                          onActivated={handleCardActivated}
                        />
                      ) : (
                        <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                          <p>{t('dashboard:virtualCardEmpty.prompt')}</p>
                          <p className="text-xs mt-2">
                            {t('dashboard:virtualCardEmpty.fee')}
                          </p>
                          <p className="text-xs">
                            {t('dashboard:virtualCardEmpty.processing')}
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {t('dashboard:payments.title')}
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="default"
                        onClick={() => navigate('/deposit')}
                        className="w-full justify-between"
                        iconName="ArrowDownToLine"
                        iconPosition="left"
                      >
                        {t('common:actions.depositMoney')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/bills')}
                        className="w-full justify-between"
                        iconName="Receipt"
                        iconPosition="left"
                      >
                        {t('common:actions.payBill')}
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
                            {t('dashboard:financialTip.title')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard:financialTip.body')}
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

      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Set your transfer PIN</h3>
            <p className="text-sm text-muted-foreground">
              Create a 4–6 digit PIN to authorize transfers and withdrawals. Do not share this PIN.
            </p>
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                value={pinForm.pin}
                onChange={(e) => setPinForm((prev) => ({ ...prev, pin: e.target.value.trim() }))}
              />
              <label className="text-xs text-muted-foreground">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm((prev) => ({ ...prev, confirmPin: e.target.value.trim() }))}
              />
              {hasTransferPin && (
                <>
                  <label className="text-xs text-muted-foreground">Current PIN (if updating)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm((prev) => ({ ...prev, currentPin: e.target.value.trim() }))}
                  />
                </>
              )}
              {pinError && (
                <div className="text-sm text-error border border-error/20 bg-error/5 rounded-md p-2">
                  {pinError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPinModal(false)} disabled={pinLoading}>
                Cancel
              </Button>
              <Button onClick={handleSavePin} loading={pinLoading}>
                Save PIN
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
