import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import { Transaction, TransactionTableProps, SortableTransactionField } from '../types';

const TransactionTable = ({
  transactions,
  onSort,
  sortConfig,
  onRowClick,
  expandedRow
}: TransactionTableProps) => {
  const { t, i18n } = useTranslation('transaction');
  const formatCurrency = (amount: number, currency: string = 'USD') =>
    new Intl.NumberFormat(i18n.language || 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(Math.abs(amount));

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language || 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);

  const getStatusColor = (status: string) => {
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

  const getTypeColor = (type: string) => {
    return type === 'credit' ? 'text-success' : 'text-error';
  };

  const renderSortIcon = (field: SortableTransactionField) => {
    if (sortConfig.field !== field) {
      return <Icon name="ChevronsUpDown" size={16} color="var(--color-muted-foreground)" />;
    }
    return sortConfig.direction === 'asc' ? (
      <Icon name="ChevronUp" size={16} color="var(--color-primary)" />
    ) : (
      <Icon name="ChevronDown" size={16} color="var(--color-primary)" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left p-4">
              <button
                onClick={() => onSort('date')}
                className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                {t('table.date')}
                {renderSortIcon('date')}
              </button>
            </th>
            <th className="text-left p-4">
              <button
                onClick={() => onSort('description')}
                className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                {t('table.description')}
                {renderSortIcon('description')}
              </button>
            </th>
            {/* <th className="text-left p-4">
              <button
                onClick={() => onSort('type')}
                className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                Type
                {renderSortIcon('type')}
              </button>
            </th> */}
            <th className="text-left p-4">
              <button
                onClick={() => onSort('status')}
                className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                {t('table.status')}
                {renderSortIcon('status')}
              </button>
            </th>
            <th className="text-right p-4">
              <button
                onClick={() => onSort('amount')}
                className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md ml-auto"
              >
                {t('table.amount')}
                {renderSortIcon('amount')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <tr
                className="border-b border-border hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                onClick={() => onRowClick(transaction)}
              >
                <td className="p-4">
                  <span className="text-sm text-foreground">
                    {formatDate(transaction.date)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground text-wrap">
                      {transaction.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {transaction.category}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                   className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {t(`filters.statusOptions.${transaction.status}`, { defaultValue: transaction.status })}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className={`text-sm font-semibold ${getTypeColor(transaction.type)}`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency || 'USD')}
                  </span>
                </td>
              </tr>
              {expandedRow === transaction.id && (
                <tr className="border-b border-border bg-muted/20">
                  <td colSpan={6} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reference Number:</span>
                        <span className="text-muted-foreground">{t('table.reference')}:</span>
                        <span className="ml-2 text-foreground font-medium">
                          {transaction.referenceNumber}
                        </span>
                      </div>
                      {transaction.merchantDetails && (
                        <>
                          <div>
                            <span className="text-muted-foreground">{t('table.merchant')}:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {transaction.merchantDetails.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('table.location')}:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {transaction.merchantDetails.location}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('table.contact')}:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {transaction.merchantDetails.contact}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
