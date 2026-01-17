import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { cn } from '../utils/cn';

type Props = {
  className?: string;
  variant?: 'primary' | 'neutral';
};

const CurrencySelector: React.FC<Props> = ({ className, variant = 'neutral' }) => {
  const { currency, setCurrency } = useCurrency();

  const selectClasses =
    variant === 'primary'
      ? 'bg-white/10 text-white border border-white/35 hover:bg-white/15 focus-visible:ring-white/70'
      : 'bg-white text-foreground border border-border hover:bg-muted focus-visible:ring-primary/50';

  const caretClasses = variant === 'primary' ? 'text-white/80' : 'text-muted-foreground';

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <span className="sr-only">Currency</span>
      <select
        aria-label="Currency selector"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        className={cn(
          'appearance-none h-10 min-w-[92px] rounded-full px-3 pr-8 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
          selectClasses
        )}
      >
        {SUPPORTED_CURRENCIES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code} - {option.label}
          </option>
        ))}
      </select>
      <span className={cn('pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs', caretClasses)}>
        ▾
      </span>
    </div>
  );
};

export default CurrencySelector;
