import React from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { PasswordStrength, RegistrationStepProps } from '../types';

interface RegistrationFormProps extends RegistrationStepProps {
  passwordStrength: PasswordStrength;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const RegistrationForm = ({
  formData,
  errors,
  onInputChange,
  passwordStrength,
  onSubmit,
  isSubmitting
}: RegistrationFormProps) => {
  const navigate = useNavigate();

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(e) => onInputChange('email', e.target.value)}
        error={errors.email}
        description="We'll never share your email with anyone"
        required
        disabled={isSubmitting}
      />

      <div>
        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          error={errors.password}
          required
          disabled={isSubmitting}
        />
        {formData.password && (
          <PasswordStrengthIndicator strength={passwordStrength} />
        )}
      </div>

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        value={formData.confirmPassword}
        onChange={(e) => onInputChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        required
        disabled={isSubmitting}
      />

      <div className="space-y-3 pt-2">
        <Checkbox
          label={
            <span className="text-sm">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                Terms of Service
              </button>
            </span>
          }
          checked={formData.agreeToTerms}
          onChange={(e) => onInputChange('agreeToTerms', e.target.checked)}
          error={errors.agreeToTerms}
          required
          disabled={isSubmitting}
        />

        <Checkbox
          label={
            <span className="text-sm">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => window.open('/privacy', '_blank')}
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                Privacy Policy
              </button>
            </span>
          }
          checked={formData.agreeToPrivacy}
          onChange={(e) => onInputChange('agreeToPrivacy', e.target.checked)}
          error={errors.agreeToPrivacy}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="pt-4 space-y-3">
        <Button
          type="submit"
          variant="default"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Create Account
        </Button>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{' '}
          </span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
            disabled={isSubmitting}
          >
            Sign In
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegistrationForm;
