import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RegistrationHeader from './components/RegistrationHeader';
import RegistrationForm from './components/RegistrationForm';
import SecurityMessage from './components/SecurityMessage';
import type { RegistrationFormData, ValidationErrors, PasswordStrength } from './types';
import { API_BASE_URL, setStoredToken } from '../../utils/api';
import { apiFetch } from 'utils/apiFetch';

const Registration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('registration');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = [
      { label: t('password.requirements.length'), met: password.length >= 8 },
      { label: t('password.requirements.uppercase'), met: /[A-Z]/.test(password) },
      { label: t('password.requirements.lowercase'), met: /[a-z]/.test(password) },
      { label: t('password.requirements.number'), met: /\d/.test(password) },
      { label: t('password.requirements.special'), met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];

    const score = requirements.filter(req => req.met).length;

    let label = t('password.strengthLabel.weak');
    let color = 'text-error';

    if (score >= 5) {
      label = t('password.strengthLabel.veryStrong');
      color = 'text-success';
    } else if (score >= 4) {
      label = t('password.strengthLabel.strong');
      color = 'text-success';
    } else if (score >= 3) {
      label = t('password.strengthLabel.medium');
      color = 'text-warning';
    } else if (score >= 2) {
      label = t('password.strengthLabel.fair');
      color = 'text-warning';
    }

    return { score, label, color, requirements };
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (awaitingOtp) {
      if (!otpCode || otpCode.trim().length !== 6) {
        newErrors.otp = t('messages.errors.otpRequired');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('messages.errors.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('messages.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('messages.errors.passwordRequired');
    } else {
      const strength = calculatePasswordStrength(formData.password);
      if (strength.score < 3) {
        newErrors.password = t('password.tooWeak');
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('messages.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('messages.errors.passwordsMismatch');
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t('messages.errors.termsRequired');
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = t('messages.errors.privacyRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = awaitingOtp ? `${API_BASE_URL}/auth/signup/verify-otp` : `${API_BASE_URL}/auth/signup`;
      const body = awaitingOtp
        ? { email: formData.email, otp: otpCode.trim() }
        : { email: formData.email, password: formData.password };

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || t('messages.errors.registrationFailed');
        setFormError(message);
        toast.error(message);
        return;
      }

      if (!awaitingOtp) {
        if (payload?.otpRequired) {
          const message = payload?.message || t('messages.info.otpPrompt');
          setFormError(null);
          setAwaitingOtp(true);
          setOtpCode('');
          toast.info(message);
          return;
        }

        if (payload?.emailVerificationRequired) {
          const message = payload?.message || t('messages.info.emailVerification');
          setFormError(null);
          toast.info(message);
          navigate('/login', { state: { email: formData.email, notice: message } });
          return;
        }
      }

      const token = payload?.token;
      const user = payload?.user;
      if (!token || !user) {
        const message = t('messages.errors.incompleteResponse');
        setFormError(message);
        toast.error(message);
        return;
      }

      setStoredToken(token, true);
      toast.success(t('messages.success.accountCreated'));

      navigate('/dashboard');
    } catch (error) {
      setErrors({
        email: t('messages.errors.registrationFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#d1202f]/10 via-background to-[#f6c33d]/10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-card overflow-hidden grid md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-[#d1202f] via-[#b71b24] to-[#f6c33d] text-white p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Icon name="Landmark" size={24} color="white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/80">{t('hero.eyebrow')}</p>
                <p className="text-xl font-semibold leading-tight">{t('hero.openAccount')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight">{t('hero.title')}</h1>
              <p className="text-white/85">{t('hero.subtitle')}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {(t('hero.features', { returnObjects: true }) as Array<{ icon: string; title: string; text: string }>).map((item) => (
                <div key={item.title} className="bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <Icon name={item.icon} size={16} color="white" />
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="text-xs text-white/80 mt-1">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-white/70 text-white hover:bg-white/10"
                onClick={() => navigate('/login')}
              >
                {t('hero.ctaLogin')}
              </Button>
              <Button
                className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                onClick={() => navigate('/about-trustpay')}
              >
                {t('hero.ctaAbout')}
              </Button>
            </div>
          </div>

          <div className="p-8 bg-card">
            <RegistrationHeader />

            {formError && (
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error mb-6">
                {formError}
              </div>
            )}
            
            {!awaitingOtp ? (
              <RegistrationForm
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
                passwordStrength={passwordStrength}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <p className="text-sm text-muted-foreground">
                  {t('form.otpInstruction', { email: formData.email })}
                </p>
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-2xl tracking-[0.4em]"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                />
                {errors.otp && <p className="text-xs text-error">{errors.otp}</p>}
                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  {t('form.verifyCode')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setAwaitingOtp(false);
                    setOtpCode('');
                    setFormError(null);
                  }}
                >
                  {t('form.editCredentials')}
                </Button>
              </form>
            )}

            <SecurityMessage />

            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                {t('form.footerNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Registration;
