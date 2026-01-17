import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Transaction } from '../types';
import { useCurrency } from '../../../context/CurrencyContext';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  const formatCurrency = (amount: number): string =>
    formatAmount(Math.abs(amount), 'USD');

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getTransactionIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'Transfer': 'ArrowRightLeft',
      'Deposit': 'ArrowDownToLine',
      'Withdrawal': 'ArrowUpFromLine',
      'Payment': 'CreditCard',
      'Purchase': 'ShoppingCart',
      'Refund': 'RotateCcw'
    };
    return iconMap[category] || 'Receipt';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
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
      </div>

      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Receipt" size={32} color="var(--color-muted-foreground)" />
            </div>
            <p className="text-muted-foreground">No recent transactions</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[720px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[130px]">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[320px]">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[250px]">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[120px]">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground align-top">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 align-top max-w-[360px]">
                          <div className="flex items-start gap-3 min-w-0 max-w-full">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-[2px]">
                              <Icon
                                name={getTransactionIcon(transaction.category)}
                                size={16}
                                color="var(--color-foreground)"
                              />
                            </div>
                            <div className="min-w-0 max-w-full">
                              <p
                                className="text-sm font-medium text-foreground overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}
                              >
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground align-top max-w-[250px]" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                          <span className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-success' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors duration-150">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon
                          name={getTransactionIcon(transaction.category)}
                          size={18}
                          color="var(--color-foreground)"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 uppercase truncate">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${transaction.type === 'credit' ? 'text-success' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
