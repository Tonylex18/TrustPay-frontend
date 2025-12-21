import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Icon from '../../../components/AppIcon';
import { Account } from '../types';

interface AccountBalanceCardProps {
  account: Account;
}

const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({ account }) => {
  const [isCopied, setIsCopied] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency
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

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(account.accountNumber);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = account.accountNumber;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      toast.success('Account number copied.');
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
      toast.error('Unable to copy account number.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm opacity-90 mb-1">Available Balance</p>
          <h2 className="text-4xl font-bold tracking-tight">
            {formatCurrency(account.balance)}
          </h2>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon name={getAccountIcon(account.type)} size={24} color="white" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/20">
        <div>
          <p className="text-xs opacity-75 mb-1">Account Type</p>
          <p className="text-sm font-medium capitalize">{account.type} Account</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-75 mb-1">Account Number</p>
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm font-medium font-data">{account.accountNumber}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Copy account number"
            >
              <Icon name={isCopied ? 'Check' : 'Copy'} size={14} color="white" />
            </button>
          </div>
          {isCopied && (
            <p className="text-[10px] opacity-80 mt-1">Copied</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountBalanceCard;
