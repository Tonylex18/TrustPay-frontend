import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { LoginFormData, ValidationErrors, SecurityTip } from './types';
import { API_BASE_URL, setStoredToken } from '../../utils/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
      title: 'Multi-layer security',
      description: 'Encrypted sessions, device recognition, and anomaly monitoring on every sign in.',
      icon: 'ShieldCheck'
    },
    {
      title: 'Two-step verification',
      description: 'We may request an extra check when risk signals increase to keep your account safe.',
      icon: 'Lock'
    },
    {
      title: '24/7 support',
      description: 'Customer service is ready if you notice unusual activity or need access help.',
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
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!awaitingOtp) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else {
      if (!otpCode || otpCode.trim().length !== 6) {
        newErrors.password = 'Enter the 6-digit code sent to your email';
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to sign in. Please try again.';
        setFormError(message);
        toast.error(message);
        return;
      }

      if (payload?.emailVerificationRequired) {
        setAwaitingOtp(false);
        setOtpCode('');
        const message = payload?.message || 'Please verify your email address to continue.';
        setFormError(message);
        toast.info(message);
        return;
      }

      if (payload?.otpRequired) {
        setAwaitingOtp(true);
        setOtpCode('');
        const message = payload?.message || 'Check your email for the 6-digit code.';
        setFormError(message);
        toast.info(message);
        return;
      }

      const token = payload?.token;
      const user = payload?.user;
      if (!token || !user) {
        const message = 'Login response was incomplete. Please try again.';
        setFormError(message);
        toast.error(message);
        return;
      }

      setStoredToken(token, formData.rememberMe);
      toast.success('Signed in successfully.');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | TrustPay</title>
        <meta
          name="description"
          content="Securely sign in to your TrustPay account to manage payments, treasury, and banking from one place."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#d1202f]/10 via-background to-[#f6c33d]/10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-card overflow-hidden grid md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-[#d1202f] via-[#b71b24] to-[#f6c33d] text-white p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Icon name="Landmark" size={24} color="white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/80">TrustPay</p>
                <p className="text-xl font-semibold leading-tight">Sign in securely</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight">Welcome back</h1>
              <p className="text-white/85">
                Access treasury, payments, and wealth dashboards from one secure place. We keep every session
                protected with layered controls.
              </p>
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
                About TrustPay
              </Button>
              <Button
                className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                onClick={() => navigate('/registration')}
              >
                Open an account
              </Button>
            </div>
          </div>

          <div className="p-8 bg-card">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">Sign on</p>
                <h2 className="text-2xl font-bold text-foreground">Log in to TrustPay</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials to continue. For help, reach out to customer service anytime.
                </p>
              </div>

              {formError && (
                <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                  {formError}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@company.com"
                error={errors.email}
                required
              />

              {!awaitingOtp ? (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
                  required
                />
              ) : (
                <Input
                  label="Login code"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  error={errors.password}
                  required
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  label="Keep me signed in"
                />
                <a
                  href="mailto:support@trustpay.com?subject=Reset%20my%20TrustPay%20password"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {awaitingOtp ? 'Verify code' : 'Sign In'}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>New to TrustPay?</span>
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => navigate('/registration')}
                >
                  Create an account
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
