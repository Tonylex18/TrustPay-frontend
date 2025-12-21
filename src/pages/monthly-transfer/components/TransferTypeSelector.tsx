import Icon from '../../../components/AppIcon';

interface TransferTypeSelectorProps {
  value: 'internal' | 'external';
  onChange: (value: 'internal' | 'external') => void;
}

const TransferTypeSelector = ({ value, onChange }: TransferTypeSelectorProps) => {
  const types = [
    {
      value: 'internal' as const,
      label: 'Internal Transfer',
      description: 'Transfer between your own accounts',
      icon: 'ArrowLeftRight',
      processingTime: 'Instant'
    },
    {
      value: 'external' as const,
      label: 'External Transfer',
      description: 'Transfer to other bank accounts',
      icon: 'Send',
      processingTime: '1-2 business days'
    }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Transfer Type <span className="text-error">*</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-ring ${
              value === type.value
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 bg-card'
            }`}
            aria-pressed={value === type.value}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  value === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <Icon
                  name={type.icon}
                  size={20}
                  color={value === type.value ? 'white' : 'var(--color-muted-foreground)'}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{type.label}</h3>
                  {value === type.value && (
                    <Icon name="Check" size={16} color="var(--color-primary)" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="Clock" size={12} />
                  <span>{type.processingTime}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransferTypeSelector;