import Icon from '../../../components/AppIcon';
import { TransferSummary } from '../types';

interface TransferSummaryCardProps {
  summary: TransferSummary;
  transferType: 'internal' | 'external';
  currency?: string;
}

const TransferSummaryCard = ({ summary, transferType, currency = 'USD' }: TransferSummaryCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="FileText" size={20} color="var(--color-primary)" />
        <h3 className="text-lg font-semibold text-foreground">Transfer Summary</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Transfer Amount</span>
          <span className="text-base font-semibold text-foreground">
            ${summary.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Processing Fee</span>
            <button
              type="button"
              className="focus:outline-none focus:ring-2 focus:ring-ring rounded"
              aria-label="Fee information"
            >
              <Icon name="Info" size={14} color="var(--color-muted-foreground)" />
            </button>
          </div>
          <span className="text-base font-medium text-foreground">
            ${summary.fee.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
          </span>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">Total Amount</span>
            <span className="text-xl font-bold text-primary">
              ${summary.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Icon name="Clock" size={16} color="var(--color-muted-foreground)" className="mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">Processing Time</p>
              <p className="text-xs text-muted-foreground mt-0.5">{summary.processingTime}</p>
            </div>
          </div>
        </div>

        {transferType === 'external' && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5" />
              <p className="text-xs text-warning-foreground">
                External transfers may take 1-2 business days to complete. Ensure recipient details are correct.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferSummaryCard;
