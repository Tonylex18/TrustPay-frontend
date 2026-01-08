import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import QuickActionPanel from '../../components/ui/QuickActionPanel';
import FilterToolbar from './components/FilterToolbar';
import TransactionTable from './components/TransactionTable';
import TransactionCard from './components/TransactionCard';
import PaginationControls from './components/PaginationControls';
import { toast } from 'react-toastify';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';
import {
  Transaction,
  TransactionFilters,
  PaginationState,
  SortConfig,
  SortableTransactionField
} from './types';
import { apiFetch } from 'utils/apiFetch';

const normalizeStatus = (value: string | null | undefined): Transaction['status'] => {
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

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('transaction');
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'date',
    direction: 'desc'
  });

  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: { start: null, end: null },
    type: 'all',
    searchQuery: '',
    status: 'all'
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [accounts, setAccounts] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = getStoredToken();

    if (!token) {
      navigate('/login');
      return;
    }

    const loadAccountsAndProfile = async () => {
      setIsLoadingAccounts(true);
      setLoadError(null);
      try {
        const [accountsRes, profileRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          })
        ]);

        if (profileRes.ok) {
          const profilePayload = await profileRes.json().catch(() => null);
          if (profilePayload) {
            setCurrentUser({
              name: profilePayload.fullName || profilePayload.email || profilePayload.id,
              email: profilePayload.email,
              avatar: profilePayload.avatarUrl
            });
          }
        }

        if (!accountsRes.ok) {
          if (accountsRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          const payload = await accountsRes.json().catch(() => null);
          const message = payload?.errors || payload?.message || 'Unable to load accounts.';
          setLoadError(message);
          setIsLoading(false);
          return;
        }

        const payload = await accountsRes.json().catch(() => []);
        const acctList: Array<{ id: string; label: string }> = Array.isArray(payload)
          ? payload.map((acct: any) => {
              const acctNum = acct.account_number || acct.accountNumber || '';
              const last4 = acctNum ? acctNum.slice(-4) : '';
              return {
                id: acct.id,
                label: `${acct.type || 'account'} ••••${last4}`
              };
            })
          : [];
        setAccounts(acctList);
        if (acctList[0]?.id) {
          setSelectedAccountId(acctList[0].id);
        } else {
          setTransactions([]);
          setIsLoading(false);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = 'Unable to load accounts.';
          setLoadError(message);
          toast.error(message);
        }
        setIsLoading(false);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccountsAndProfile();

    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    const token = getStoredToken();

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchTransactions = async () => {
      if (!selectedAccountId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const transactionResponse = await apiFetch(
          `${API_BASE_URL}/accounts/${selectedAccountId}/transactions?limit=200`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }
        );

        const transactionPayload = await transactionResponse.json().catch(() => null);
        if (!transactionResponse.ok) {
          const message = transactionPayload?.errors || transactionPayload?.message || 'Unable to load transactions.';
          if (transactionResponse.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setLoadError(message);
          toast.error(message);
          return;
        }

        const normalized = (transactionPayload || []).map((entry: any) => {
          const rawStatus = entry.transaction?.status ?? entry.status ?? '';
          const status = normalizeStatus(String(rawStatus));
          const txId = entry.transaction?.id || entry.transactionId || entry.id;
          const isExternal =
            entry.transaction?.type === 'INTERNAL_TRANSFER' && !entry.transaction?.destinationAccountId;

          return {
            id: txId,
            date: new Date(entry.created_at || entry.createdAt || entry.transaction?.createdAt || Date.now()),
            description:
              entry.description ||
              entry.transaction?.description ||
              (isExternal ? 'External transfer' : 'Transaction'),
            amount: entry.amount,
            type: ((entry.entry_type || entry.entryType || 'debit') as string).toLowerCase() as Transaction['type'],
            status,
            category: isExternal ? 'EXTERNAL_TRANSFER' : entry.transaction?.type || 'ledger',
            referenceNumber: txId,
            currency: entry.transaction?.currency || 'USD',
            counterparty: entry.transaction?.counterparty,
            note: entry.transaction?.description
          } as Transaction;
        });

        // merge duplicates (pending + completed for same transaction id)
        const statusPriority: Record<Transaction["status"], number> = { completed: 2, failed: 1, pending: 0 };
        const mergedMap = new Map<string, Transaction>();
        normalized.forEach((tx: Transaction) => {
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

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );

        setTransactions(merged);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = 'Unable to load transactions.';
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
    return () => controller.abort();
  }, [navigate, selectedAccountId]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filters.dateRange.start) {
      filtered = filtered.filter(
        (t) => t.date >= filters.dateRange.start!
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(
        (t) => t.date <= filters.dateRange.end!
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.amount.toString().includes(query) ||
          t.referenceNumber.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, filters, sortConfig]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalItems: filteredAndSortedTransactions.length,
      totalPages: Math.ceil(
        filteredAndSortedTransactions.length / prev.itemsPerPage
      ),
      currentPage: 1
    }));
  }, [filteredAndSortedTransactions]);

  const handleSort = (field: SortableTransactionField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowClick = (transaction: Transaction) => {
    setExpandedRow((prev) => (prev === transaction.id ? null : transaction.id));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    setExpandedRow(null);
  };

  const handleItemsPerPageChange = (items: number) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: items,
      currentPage: 1,
      totalPages: Math.ceil(filteredAndSortedTransactions.length / items)
    }));
    setExpandedRow(null);
  };

  const handleExport = () => {
    if (filteredAndSortedTransactions.length === 0) {
      toast.info(t('filters.noExport'));
      return;
    }

    const csvContent = [
      [t('table.date'), t('table.description'), 'Type', t('table.amount'), t('table.status'), t('table.reference')],
      ...filteredAndSortedTransactions.map((t) => [
        t.date.toISOString(),
        t.description,
        t.type,
        t.amount.toString(),
        t.status,
        t.referenceNumber
      ])
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('filters.exportSuccess'));
  };

  const quickActions = [
    {
      label: t('quickActions.transfer'),
      icon: 'Send',
      onClick: () => navigate('/money-transfer'),
      variant: 'default' as const,
      description: t('quickActions.transferDesc')
    },
    {
      label: t('quickActions.dashboard'),
      icon: 'Home',
      onClick: () => navigate('/dashboard'),
      variant: 'outline' as const,
      description: t('quickActions.dashboardDesc')
    },
    {
      label: t('quickActions.profile'),
      icon: 'User',
      onClick: () => navigate('/user-profile'),
      variant: 'outline' as const,
      description: t('quickActions.profileDesc')
    }
  ];

  const breadcrumbItems = [
    { label: t('breadcrumb.dashboard'), path: '/dashboard' },
    { label: t('breadcrumb.transactions') }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={currentUser || undefined} onNavigate={(path) => navigate(path)} />

      <main className="pt-nav-height px-nav-margin pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mt-6">
            <BreadcrumbTrail items={breadcrumbItems} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">{t('page.title')}</h1>
            <p className="text-muted-foreground">{t('page.subtitle')}</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {isLoadingAccounts
                ? t('page.loadingAccounts')
                : accounts.length === 0
                  ? t('page.noAccounts')
                  : t('page.selectAccount')}
            </div>
            {accounts.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-foreground" htmlFor="account-select">
                  {t('page.accountLabel')}
                </label>
                <select
                  id="account-select"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedAccountId ?? ''}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {accounts.map((acct) => (
                    <option key={acct.id} value={acct.id}>
                      {acct.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {accounts.length === 0 && !isLoadingAccounts && (
              <button
                className="text-sm text-primary underline"
                onClick={() => navigate('/dashboard')}
                type="button"
              >
                {t('page.ctaCreate')}
              </button>
            )}
          </div>

          <QuickActionPanel
            actions={quickActions}
            title={t('quickActions.title')}
            layout="horizontal"
            description={t('quickActions.description')}
          />

          <FilterToolbar
            filters={filters}
            onFilterChange={setFilters}
            resultsCount={filteredAndSortedTransactions.length}
            onExport={handleExport}
          />

          {isLoading ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center shadow-card text-muted-foreground">
              Loading transactions...
            </div>
          ) : loadError ? (
            <div className="bg-error/5 border border-error/20 rounded-lg p-6 text-sm text-error">
              {loadError}
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center shadow-card">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    No transactions found
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {paginatedTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      isExpanded={expandedRow === transaction.id}
                      onToggle={() => handleRowClick(transaction)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
                  <TransactionTable
                    transactions={paginatedTransactions}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    onRowClick={handleRowClick}
                    expandedRow={expandedRow}
                  />
                </div>
              )}

              {pagination.totalPages > 1 && (
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
