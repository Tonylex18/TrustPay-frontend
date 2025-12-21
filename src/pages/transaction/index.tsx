import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const TransactionsPage = () => {
  const navigate = useNavigate();
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

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

    const fetchTransactions = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [transactionResponse, profileResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/transactions`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          })
        ]);

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

        const profilePayload = await profileResponse.json().catch(() => null);
        if (profileResponse.ok && profilePayload?.data) {
          setCurrentUser({
            name: profilePayload.data.fullName,
            email: profilePayload.data.email,
            avatar: profilePayload.data.avatarUrl
          });
        }

        const data = transactionPayload?.data as Array<{
          id: string;
          date: string;
          description: string;
          amount: number;
          type: 'credit' | 'debit';
          status: 'completed' | 'pending' | 'failed';
          category: string;
          reference?: string;
          currency?: string;
          counterparty?: string;
          note?: string;
        }>;

        const normalized = (data || []).map((transaction) => ({
          id: transaction.id,
          date: new Date(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          category: transaction.category,
          referenceNumber: transaction.reference || transaction.id,
          currency: transaction.currency,
          counterparty: transaction.counterparty,
          note: transaction.note
        }));

        setTransactions(normalized);
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
  }, [navigate]);

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
      toast.info('No transactions to export.');
      return;
    }

    const csvContent = [
      ['Date', 'Description', 'Type', 'Amount', 'Status', 'Reference'],
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
    toast.success('Transactions exported.');
  };

  const quickActions = [
    {
      label: 'Transfer Money',
      icon: 'Send',
      onClick: () => navigate('/money-transfer'),
      variant: 'default' as const,
      description: 'Send money to any account'
    },
    {
      label: 'View Dashboard',
      icon: 'Home',
      onClick: () => navigate('/dashboard'),
      variant: 'outline' as const,
      description: 'Go to dashboard'
    },
    {
      label: 'Profile Settings',
      icon: 'User',
      onClick: () => navigate('/user-profile'),
      variant: 'outline' as const,
      description: 'Manage your profile'
    }
  ];

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Transactions' }
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
            <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">
              View and manage all your banking transactions
            </p>
          </div>

          <QuickActionPanel
            actions={quickActions}
            title="Quick Actions"
            layout="horizontal"
            description="Perform quick actions from here"
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
