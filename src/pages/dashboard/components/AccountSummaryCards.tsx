import React from 'react';
import Icon from '../../../components/AppIcon';
import { Account } from '../types';
import { useCurrency } from '../../../context/CurrencyContext';

interface AccountSummaryCardsProps {
  accounts: Account[];
  onSelect?: (account: Account) => void;
}

const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({ accounts, onSelect }) => {
  const { formatAmount, currency } = useCurrency();

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
    <div className="grid grid-cols-1 gap-4">
      {accounts.map((account) => (
        <button
          type="button"
          key={account.id}
          onClick={() => onSelect?.(account)}
          className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 w-full text-left flex flex-col gap-3"
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 bg-gradient-to-br ${getAccountColor(account.type)} rounded-lg flex items-center justify-center`}>
              <Icon name={getAccountIcon(account.type)} size={20} color="white" />
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 capitalize px-2 py-1 rounded-full">
              {account.type}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-md md:text-2xl font-bold text-foreground">
              {formatAmount(account.balance, account.currency)}
            </p>
            <p className="text-xs text-muted-foreground font-data uppercase tracking-wide">
              {currency} ••••{account.accountNumber.slice(-4)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AccountSummaryCards;
