import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { TransferSummary, VerifiedAccount } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  beneficiary: VerifiedAccount;
  amount: string;
  transferType: 'internal' | 'external';
  memo: string;
  summary: TransferSummary;
  isProcessing: boolean;
  errorMessage?: string | null;
  currency?: string;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  beneficiary,
  amount,
  transferType,
  memo,
  summary,
  isProcessing,
  errorMessage,
  currency = 'USD'
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div
        className="bg-card rounded-lg shadow-modal max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 id="confirmation-title" className="text-lg font-semibold text-foreground">
            Confirm Transfer
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            aria-label="Close confirmation modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Send" size={32} color="var(--color-primary)" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">Transfer Amount</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Icon name="User" size={24} color="var(--color-primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{beneficiary.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{beneficiary.bankName}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-medium text-foreground">{beneficiary.accountNumber}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Transfer Type</span>
              <span className="font-medium text-foreground capitalize">{transferType}</span>
            </div>
            {memo && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Memo</span>
                <span className="font-medium text-foreground text-right max-w-[60%]">{memo}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-medium text-foreground">
                ${summary.fee.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-border">
              <span className="font-semibold text-foreground">Total Debit</span>
              <span className="font-bold text-primary">
                ${summary.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warning-foreground">
                Please verify all details carefully. This transaction cannot be reversed once confirmed.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            loading={isProcessing}
            iconName="Check"
            iconPosition="left"
            fullWidth
          >
            {isProcessing ? 'Processing...' : 'Confirm Transfer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
