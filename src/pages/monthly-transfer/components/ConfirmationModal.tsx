import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { TransferSummary, VerifiedAccount } from '../types';
import { useTranslation } from 'react-i18next';

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
  locale?: string;
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
  currency = 'USD',
  locale = 'en-US'
}: ConfirmationModalProps) => {
  const { t } = useTranslation('transfer');
  if (!isOpen) return null;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(value);

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
            {t('confirmation.title')}
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
              {formatCurrency(parseFloat(amount))}
            </p>
            <p className="text-sm text-muted-foreground">{t('confirmation.amount')}</p>
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
                <span className="text-muted-foreground">{t('confirmation.accountNumber')}</span>
                <span className="font-medium text-foreground">{beneficiary.accountNumber}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t('confirmation.transferType')}</span>
              <span className="font-medium text-foreground capitalize">
                {t(`transferType.options.${transferType}.title`)}
              </span>
            </div>
            {memo && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t('confirmation.memo')}</span>
                <span className="font-medium text-foreground text-right max-w-[60%]">{memo}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t('confirmation.fee')}</span>
              <span className="font-medium text-foreground">
                {formatCurrency(summary.fee)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-border">
              <span className="font-semibold text-foreground">{t('confirmation.total')}</span>
              <span className="font-bold text-primary">
                {formatCurrency(summary.total)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warning-foreground">
                {t('confirmation.warning')}
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
            {t('confirmation.cancel')}
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            loading={isProcessing}
            iconName="Check"
            iconPosition="left"
            fullWidth
          >
            {isProcessing ? t('confirmation.processing') : t('confirmation.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
