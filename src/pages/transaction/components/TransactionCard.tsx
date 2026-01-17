import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import { TransactionCardProps } from '../types';
import { useCurrency } from '../../../context/CurrencyContext';

const TransactionCard = ({ transaction, isExpanded, onToggle }: TransactionCardProps) => {
  const { t, i18n } = useTranslation('transaction');
  const { formatAmount } = useCurrency();
  const formatCurrency = (amount: number, currency: string = 'USD') =>
    formatAmount(Math.abs(amount), currency, i18n.language || 'en-US');

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

  const getTypeIcon = (type: string) => {
    return type === 'credit' ? 'ArrowDownLeft' : 'ArrowUpRight';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              transaction.type === 'credit' ? 'bg-success/10' : 'bg-error/10'
            }`}
          >
            <Icon
              name={getTypeIcon(transaction.type)}
              size={20}
              color={transaction.type === 'credit' ? 'var(--color-success)' : 'var(--color-error)'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {transaction.description}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{transaction.category}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(transaction.date)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-base font-bold ${getTypeColor(transaction.type)}`}>
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount, transaction.currency || 'USD')}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
              transaction.status
            )}`}
          >
            {t(`filters.statusOptions.${transaction.status}`, { defaultValue: transaction.status })}
          </span>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="w-full mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
      >
        <span>{isExpanded ? t('card.hideDetails') : t('card.viewDetails')}</span>
        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('card.reference')}</span>
            <span className="text-sm text-foreground font-medium">
              {transaction.referenceNumber}
            </span>
          </div>

          {transaction.merchantDetails && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('card.merchant')}</span>
                <span className="text-sm text-foreground font-medium">
                  {transaction.merchantDetails.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('card.location')}</span>
                <span className="text-sm text-foreground font-medium">
                  {transaction.merchantDetails.location}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('card.contact')}</span>
                <span className="text-sm text-foreground font-medium">
                  {transaction.merchantDetails.contact}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
