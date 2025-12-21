import React, { useState } from 'react';
import { ContactPreferences } from '../types';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

interface ContactPreferencesFormProps {
  initialPreferences: ContactPreferences;
  onSave: (preferences: ContactPreferences) => void;
}

const ContactPreferencesForm = ({ initialPreferences, onSave }: ContactPreferencesFormProps) => {
  const [preferences, setPreferences] = useState<ContactPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof ContactPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(preferences);
      setIsSaving(false);
    }, 1000);
  };

  const preferenceItems = [
    {
      key: 'emailNotifications' as keyof ContactPreferences,
      label: 'Email Notifications',
      description: 'Receive account updates and important notifications via email',
      icon: 'Mail'
    },
    {
      key: 'smsNotifications' as keyof ContactPreferences,
      label: 'SMS Notifications',
      description: 'Get instant alerts for transactions and security updates via SMS',
      icon: 'MessageSquare'
    },
    {
      key: 'promotionalEmails' as keyof ContactPreferences,
      label: 'Promotional Emails',
      description: 'Receive information about new features, offers, and banking products',
      icon: 'Tag'
    },
    {
      key: 'transactionAlerts' as keyof ContactPreferences,
      label: 'Transaction Alerts',
      description: 'Get real-time notifications for all account transactions',
      icon: 'Bell'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
        <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Manage how you want to receive communications from TrustPay. You can update these preferences at any time.
        </p>
      </div>

      <div className="space-y-4">
        {preferenceItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon} size={20} color="var(--color-primary)" />
            </div>
            <div className="flex-1 min-w-0">
              <Checkbox
                label={item.label}
                description={item.description}
                checked={preferences[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button
          variant="default"
          onClick={handleSave}
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
          fullWidth
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default ContactPreferencesForm;