import React, { useState } from 'react';
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
  const [formData, setFormData] = useState<ProfileEditData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={handleChange('fullName')}
          error={errors.fullName}
          required
          placeholder="Enter your full name"
        />

        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
          placeholder="Enter your email address"
        />

        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          required
          placeholder="Enter your phone number"
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
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditForm;