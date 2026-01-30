import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

interface ProfileInfoDisplayProps {
  profile: UserProfile;
  onEdit: () => void;
}

const ProfileInfoDisplay = ({ profile, onEdit }: ProfileInfoDisplayProps) => {
  const { t, i18n } = useTranslation('profile');
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language || 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const infoItems = [
    {
      icon: 'User',
      label: t('profile.fields.fullName'),
      value: profile.fullName
    },
    {
      icon: 'Mail',
      label: t('profile.fields.email'),
      value: profile.email
    },
    ...(profile.phone
      ? [
          {
            icon: 'Phone',
            label: t('profile.fields.phone'),
            value: profile.phone
          }
        ]
      : []),
    {
      icon: 'Calendar',
      label: t('profile.fields.memberSince'),
      value: formatDate(profile.dateJoined)
    },
    {
      icon: 'Clock',
      label: t('profile.fields.lastLogin'),
      value: formatDate(profile.lastLogin)
    },
    ...(profile.kycStatus
      ? [
          {
            icon: 'ShieldCheck',
            label: t('profile.fields.kycStatus'),
            value: profile.kycStatus
          }
        ]
      : []),
    ...(profile.kycDocumentType
      ? [
          {
            icon: 'FileCheck',
            label: t('profile.fields.documentType'),
            value: profile.kycDocumentType
          }
        ]
      : []),
    ...(profile.kycCountry
      ? [
          {
            icon: 'Globe2',
            label: t('profile.fields.country'),
            value: profile.kycCountry
          }
        ]
      : []),
    ...(profile.kycUpdatedAt
      ? [
          {
            icon: 'CalendarClock',
            label: t('profile.fields.verifiedAt'),
            value: formatDate(profile.kycUpdatedAt)
          }
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {infoItems.map((item, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name={item.icon} size={20} color="var(--color-primary)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-base font-medium text-foreground mt-1 break-words">{item.value}</p>
          </div>
        </div>
      ))}

      <div className="pt-4">
        <Button
          variant="outline"
          onClick={onEdit}
          iconName="Edit"
          iconPosition="left"
          fullWidth
        >
          {t('profile.editButton')}
        </Button>
      </div>
    </div>
  );
};

export default ProfileInfoDisplay;
