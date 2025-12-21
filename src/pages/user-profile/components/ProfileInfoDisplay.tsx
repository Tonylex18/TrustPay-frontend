import React from 'react';
import { UserProfile } from '../types';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

interface ProfileInfoDisplayProps {
  profile: UserProfile;
  onEdit: () => void;
}

const ProfileInfoDisplay = ({ profile, onEdit }: ProfileInfoDisplayProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const infoItems = [
    {
      icon: 'User',
      label: 'Full Name',
      value: profile.fullName
    },
    {
      icon: 'Mail',
      label: 'Email Address',
      value: profile.email
    },
    {
      icon: 'Phone',
      label: 'Phone Number',
      value: profile.phone
    },
    {
      icon: 'Calendar',
      label: 'Member Since',
      value: formatDate(profile.dateJoined)
    },
    {
      icon: 'Clock',
      label: 'Last Login',
      value: formatDate(profile.lastLogin)
    }
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
          Edit Profile Information
        </Button>
      </div>
    </div>
  );
};

export default ProfileInfoDisplay;