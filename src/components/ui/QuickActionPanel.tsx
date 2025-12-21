import Button from './Button';

interface QuickAction {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  description?: string;
}

interface QuickActionPanelProps {
  actions?: QuickAction[];
  title?: string;
  description?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    label: 'Transfer Money',
    icon: 'Send',
    onClick: () => {},
    variant: 'default',
    description: 'Send money to any account'
  },
  {
    label: 'Pay Bills',
    icon: 'Receipt',
    onClick: () => {},
    variant: 'outline',
    description: 'Pay your utility bills'
  },
  {
    label: 'View Transactions',
    icon: 'List',
    onClick: () => {},
    variant: 'outline',
    description: 'Check transaction history'
  },
  {
    label: 'Add Beneficiary',
    icon: 'UserPlus',
    onClick: () => {},
    variant: 'secondary',
    description: 'Add new beneficiary'
  }
];

const QuickActionPanel = ({
  actions = defaultActions,
  title = 'Quick Actions',
  description,
  layout = 'grid',
  className = ''
}: QuickActionPanelProps) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-3';
      case 'vertical':
        return 'flex flex-col gap-3';
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
    }
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-6 shadow-card ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className={getLayoutClasses()}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            onClick={action.onClick}
            iconName={action.icon as any}
            iconPosition="left"
            iconSize={20}
            className={`
              ${layout === 'vertical' || layout === 'grid' ? 'w-full justify-start' : ''}
              ${layout === 'grid' ? 'h-auto py-4 flex-col items-start gap-2' : ''}
            `}
          >
            <div className={layout === 'grid' ? 'flex flex-col items-start gap-1' : ''}>
              <span className="font-medium">{action.label}</span>
              {action.description && layout === 'grid' && (
                <span className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </span>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionPanel;