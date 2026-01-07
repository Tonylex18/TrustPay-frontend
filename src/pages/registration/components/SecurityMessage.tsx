import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';

const SecurityMessage = () => {
  const { t } = useTranslation('registration');
  const securityFeatures = t('security.items', { returnObjects: true }) as string[];

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon name="ShieldCheck" size={20} color="var(--color-primary)" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground mb-2">
            {t('security.title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {securityFeatures?.map((text, index) => (
              <div key={index} className="flex items-center gap-2">
                <Icon name={index === 0 ? 'Shield' : index === 1 ? 'Lock' : 'Eye'} size={14} color="var(--color-primary)" />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMessage;
