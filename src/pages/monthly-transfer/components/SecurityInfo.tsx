import Icon from '../../../components/AppIcon';
import { TransferLimits } from '../types';
import { useTranslation } from 'react-i18next';

interface SecurityInfoProps {
  limits: TransferLimits;
  locale?: string;
}

const SecurityInfo = ({ limits, locale = 'en-US' }: SecurityInfoProps) => {
  const { t } = useTranslation('transfer');
  const percentageUsed = limits.dailyLimit
    ? ((limits.dailyLimit - limits.remainingToday) / limits.dailyLimit) * 100
    : 0;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: limits.currency.toUpperCase() }).format(value);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Shield" size={20} color="var(--color-primary)" />
        <h3 className="text-lg font-semibold text-foreground">{t('security.title')}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t('security.dailyLimit')}</span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(limits.dailyLimit)}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percentageUsed}%` }}
              role="progressbar"
              aria-valuenow={percentageUsed}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('security.dailyLimit')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('security.remainingToday', { amount: formatCurrency(limits.remainingToday) })}
          </p>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-start gap-2">
            <Icon name="Lock" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t('security.items.secureTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('security.items.secureDescription')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="Bell" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t('security.items.notificationsTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('security.items.notificationsDescription')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="History" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t('security.items.historyTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('security.items.historyDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityInfo;
