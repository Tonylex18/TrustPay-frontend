import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { LoginFormData, ValidationErrors, SecurityTip } from './types';
import { API_BASE_URL, setStoredToken } from '../../utils/api';
import { apiFetch } from 'utils/apiFetch';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [otpCode, setOtpCode] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const securityTips: SecurityTip[] = [
    {
      title: t('auth:tips.multiLayer.title'),
      description: t('auth:tips.multiLayer.description'),
      icon: 'ShieldCheck'
    },
    {
      title: t('auth:tips.twoStep.title'),
      description: t('auth:tips.twoStep.description'),
      icon: 'Lock'
    },
    {
      title: t('auth:tips.support.title'),
      description: t('auth:tips.support.description'),
      icon: 'Headset'
    }
  ];

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    if (awaitingOtp && field === 'email') {
      setAwaitingOtp(false);
      setOtpCode('');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = t('auth:errors.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth:errors.emailInvalid');
    }

    if (!awaitingOtp) {
      if (!formData.password) {
        newErrors.password = t('auth:errors.passwordRequired');
      } else if (formData.password.length < 6) {
        newErrors.password = t('auth:errors.passwordLength');
      }
    } else {
      if (!otpCode || otpCode.trim().length !== 6) {
        newErrors.password = t('auth:errors.codeRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const endpoint = awaitingOtp ? `${API_BASE_URL}/auth/login/verify-otp` : `${API_BASE_URL}/auth/login`;
      const payloadBody = awaitingOtp
        ? { email: formData.email, otp: otpCode.trim() }
        : { email: formData.email, password: formData.password };

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || t('auth:messages.loginError');
        setFormError(message);
        toast.error(message);
        return;
      }

      if (payload?.emailVerificationRequired) {
        setAwaitingOtp(false);
        setOtpCode('');
        const message = payload?.message || t('auth:messages.verifyEmail');
        setFormError(message);
        toast.info(message);
        return;
      }

      if (payload?.otpRequired) {
        setAwaitingOtp(true);
        setOtpCode('');
        const message = payload?.message || t('auth:messages.checkEmailCode');
        setFormError(message);
        toast.info(message);
        return;
      }

      const token = payload?.token;
      const user = payload?.user;
      if (!token || !user) {
        const message = t('auth:messages.incompleteResponse');
        setFormError(message);
        toast.error(message);
        return;
      }

      setStoredToken(token, formData.rememberMe);
      toast.success(t('auth:messages.success'));
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth:metaTitle')}</title>
        <meta name="description" content={t('auth:metaDescription')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#d1202f]/10 via-background to-[#f6c33d]/10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-card overflow-hidden grid md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-[#d1202f] via-[#b71b24] to-[#f6c33d] text-white p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Icon name="Landmark" size={24} color="white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/80">{t('auth:heroTag')}</p>
                <p className="text-xl font-semibold leading-tight">{t('auth:heroTitle')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight">{t('auth:heroHeading')}</h1>
              <p className="text-white/85">{t('auth:heroBody')}</p>
            </div>

            <div className="space-y-4">
              {securityTips.map((tip) => (
                <div key={tip.title} className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon name={tip.icon} size={18} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tip.title}</p>
                    <p className="text-xs text-white/80">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-white/70 text-white hover:bg-white/10"
                onClick={() => navigate('/about-trustpay')}
              >
                {t('auth:cta.about')}
              </Button>
              <Button
                className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                onClick={() => navigate('/registration')}
              >
                {t('auth:cta.openAccount')}
              </Button>
            </div>
          </div>

          <div className="p-8 bg-card">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">{t('auth:form.eyebrow')}</p>
                <h2 className="text-2xl font-bold text-foreground">{t('auth:form.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('auth:form.description')}</p>
              </div>

              {formError && (
                <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                  {formError}
                </div>
              )}

              <Input
                label={t('auth:form.emailLabel')}
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('auth:form.placeholders.email')}
                error={errors.email}
                required
              />

              {!awaitingOtp ? (
                <Input
                  label={t('auth:form.passwordLabel')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={t('auth:form.placeholders.password')}
                  error={errors.password}
                  required
                />
              ) : (
                <Input
                  label={t('auth:form.codeLabel')}
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder={t('auth:form.placeholders.code')}
                  error={errors.password}
                  required
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  label={t('auth:form.rememberMe')}
                />
                <a
                  href="mailto:support@trustpay.com?subject=Reset%20my%20TrustPay%20password"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t('auth:form.forgotPassword')}
                </a>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {awaitingOtp ? t('auth:form.submitVerify') : t('auth:form.submitSignIn')}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t('auth:form.newToTrustPay')}</span>
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => navigate('/registration')}
                >
                  {t('auth:form.createAccount')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
