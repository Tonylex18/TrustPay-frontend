import React, { useState } from 'react';
import { PasswordChangeData, ValidationErrors } from '../types';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

interface PasswordChangeFormProps {
  onSave: (data: PasswordChangeData) => void;
  onCancel: () => void;
}

const PasswordChangeForm = ({ onSave, onCancel }: PasswordChangeFormProps) => {
  const [formData, setFormData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const validatePassword = (password: string): string | undefined => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    } else if (formData.currentPassword !== 'Bank@123') {
      newErrors.currentPassword = 'Current password is incorrect';
    }

    const passwordError = validatePassword(formData.newPassword);
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordError) {
      newErrors.newPassword = passwordError;
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  const handleChange = (field: keyof PasswordChangeData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (!password) return { strength: '', color: '', width: '0%' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: 'bg-error', width: '33%' };
    if (score <= 4) return { strength: 'Medium', color: 'bg-warning', width: '66%' };
    return { strength: 'Strong', color: 'bg-success', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
        <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Password Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>At least 8 characters long</li>
            <li>Contains uppercase and lowercase letters</li>
            <li>Contains at least one number</li>
            <li>Contains at least one special character (!@#$%^&*)</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={handleChange('currentPassword')}
            error={errors.currentPassword}
            required
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPasswords.current ? 'EyeOff' : 'Eye'} size={20} />
          </button>
        </div>

        <div className="relative">
          <Input
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            error={errors.newPassword}
            required
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPasswords.new ? 'EyeOff' : 'Eye'} size={20} />
          </button>
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Password Strength:</span>
                <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            required
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPasswords.confirm ? 'EyeOff' : 'Eye'} size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          variant="default"
          loading={isSaving}
          iconName="Lock"
          iconPosition="left"
          fullWidth
        >
          Change Password
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

export default PasswordChangeForm;