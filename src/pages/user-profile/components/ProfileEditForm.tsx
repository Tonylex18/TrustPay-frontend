import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileEditData, ValidationErrors } from '../types';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ProfilePictureUpload from './ProfilePictureUpload';

interface ProfileEditFormProps {
  initialData: ProfileEditData;
  currentPicture: string;
  currentPictureAlt: string;
  onSave: (data: ProfileEditData) => void;
  onCancel: () => void;
}

const ProfileEditForm = ({ initialData, currentPicture, currentPictureAlt, onSave, onCancel }: ProfileEditFormProps) => {
  const { t } = useTranslation('profile');
  const [formData, setFormData] = useState<ProfileEditData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('editForm.errors.fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('editForm.errors.fullNameMin');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('editForm.errors.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('editForm.errors.emailInvalid');
    }

    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!formData.phone.trim()) {
      newErrors.phone = t('editForm.errors.phoneRequired');
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = t('editForm.errors.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 1000);
  };

  const handleChange = (field: keyof ProfileEditData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handlePictureUpload = (file: File) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: file
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfilePictureUpload
        currentPicture={currentPicture}
        currentPictureAlt={currentPictureAlt}
        onUpload={handlePictureUpload}
        error={errors.profilePicture}
      />

      <div className="space-y-4">
        <Input
          label={t('profile.fields.fullName')}
          type="text"
          value={formData.fullName}
          onChange={handleChange('fullName')}
          error={errors.fullName}
          required
          placeholder={t('editForm.placeholders.fullName')}
        />

        <Input
          label={t('profile.fields.email')}
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
          placeholder={t('editForm.placeholders.email')}
        />

        <Input
          label={t('profile.fields.phone')}
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          required
          placeholder={t('editForm.placeholders.phone')}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          variant="default"
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
          fullWidth
        >
          {t('editForm.buttons.save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          fullWidth
        >
          {t('editForm.buttons.cancel')}
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
