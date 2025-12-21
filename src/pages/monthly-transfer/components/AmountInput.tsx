import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';


interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  balance: number;
  error?: string;
  maxAmount: number;
  remainingDaily: number;
  currency: string;
}

const AmountInput = ({ value, onChange, balance, error, maxAmount, remainingDaily, currency }: AmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const formatCurrency = (amount: string): string => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9.]/g, '');
    const parts = inputValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChange(inputValue);
  };

  const setQuickAmount = (amount: number) => {
    onChange(amount.toString());
  };

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Transfer Amount <span className="text-error">*</span>
      </label>

      <div className="relative">
        <div
          className={`flex items-center px-4 py-3 bg-background border rounded-lg transition-all duration-200 ${
            isFocused ? 'border-primary ring-2 ring-ring' : error ? 'border-error' : 'border-input'
          }`}
        >
          <span className="text-lg font-semibold text-muted-foreground mr-2">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleAmountChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="0.00"
            className="flex-1 text-2xl font-semibold text-foreground bg-transparent outline-none"
            aria-label="Transfer amount in dollars"
            aria-invalid={!!error}
            aria-describedby={error ? 'amount-error' : undefined}
          />
        </div>

        {value && !error && (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(value)} {currency.toUpperCase()}
          </p>
        )}

        {error && (
          <p id="amount-error" className="mt-1 text-sm text-error flex items-center gap-1">
            <Icon name="AlertCircle" size={16} />
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setQuickAmount(amount)}
            disabled={amount > maxAmount}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              amount > maxAmount
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring'
            }`}
          >
            ${amount.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Available Balance:</span>
          <span className="font-semibold text-foreground">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Daily Limit Remaining:</span>
          <span className="font-semibold text-foreground">
            ${remainingDaily.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AmountInput;
