import React from 'react';
import Icon from '../../../components/AppIcon';
import { Account } from '../types';

interface AccountSummaryCardsProps {
  accounts: Account[];
}

const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({ accounts }) => {
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getAccountIcon = (type: string): string => {
    switch (type) {
      case 'checking':
        return 'Wallet';
      case 'savings':
        return 'PiggyBank';
      case 'credit':
        return 'CreditCard';
      default:
        return 'Wallet';
    }
  };

  const getAccountColor = (type: string): string => {
    switch (type) {
      case 'checking':
        return 'from-blue-500 to-blue-600';
      case 'savings':
        return 'from-emerald-500 to-emerald-600';
      case 'credit':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${getAccountColor(account.type)} rounded-lg flex items-center justify-center`}>
              <Icon name={getAccountIcon(account.type)} size={20} color="white" />
            </div>
            <span className="text-xs font-medium text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
              {account.type}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(account.balance, account.currency)}
            </p>
            <p className="text-sm text-muted-foreground font-data">
              ****{account.accountNumber.slice(-4)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountSummaryCards;