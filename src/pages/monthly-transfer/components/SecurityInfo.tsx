import Icon from '../../../components/AppIcon';
import { TransferLimits } from '../types';

interface SecurityInfoProps {
  limits: TransferLimits;
}

const SecurityInfo = ({ limits }: SecurityInfoProps) => {
  const percentageUsed = limits.dailyLimit
    ? ((limits.dailyLimit - limits.remainingToday) / limits.dailyLimit) * 100
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Shield" size={20} color="var(--color-primary)" />
        <h3 className="text-lg font-semibold text-foreground">Security & Limits</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Transfer Limit</span>
            <span className="text-sm font-semibold text-foreground">
              ${limits.dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
              aria-label="Daily limit usage"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${limits.remainingToday.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining today
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Per Transaction Limit</span>
            <span className="text-sm font-semibold text-foreground">
              ${limits.perTransactionLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-start gap-2">
            <Icon name="Lock" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Secure Transfer</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All transfers are encrypted and protected
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="Bell" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Instant Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified for every transaction
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="History" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Transaction History</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track all your transfers anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityInfo;
