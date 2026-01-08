import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadStripe, type StripeElements, type StripeIssuingCardCvcDisplayElement, type StripeIssuingCardExpiryDisplayElement, type StripeIssuingCardNumberDisplayElement } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import { API_BASE_URL } from '../../../utils/api';
import { apiFetch } from 'utils/apiFetch';
import { toast } from 'react-toastify';

type CardSummary = {
  id: string;
  brand: string;
  last4: string;
  status: string;
  bankAccountId: string;
  stripeCardId?: string;
  createdAt?: string;
  activationStatus?: string;
  activatedAt?: string;
};

type Props = {
  card: CardSummary;
  token: string;
  linkedAccountLast4?: string;
  userEmail?: string;
  onActivated?: (cardId: string) => void;
};

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : Promise.resolve(null);

const CardDetailsDisplay: React.FC<Props> = ({ card, token, linkedAccountLast4, userEmail, onActivated }) => {
  const { t } = useTranslation(['cards', 'common']);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [sendingActivation, setSendingActivation] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState(card.activationStatus || card.status);

  const numberRef = useRef<HTMLDivElement | null>(null);
  const cvcRef = useRef<HTMLDivElement | null>(null);
  const expiryRef = useRef<HTMLDivElement | null>(null);
  const mountedElements = useRef<{
    elements: StripeElements | null;
    number: StripeIssuingCardNumberDisplayElement | null;
    cvc: StripeIssuingCardCvcDisplayElement | null;
    expiry: StripeIssuingCardExpiryDisplayElement | null;
  } | null>(null);

  const statusBadge = useMemo(() => {
    const normalized = card.status?.toLowerCase?.() || '';
    const pillColor =
      normalized === 'active'
        ? 'bg-success/10 text-success border-success/30'
        : normalized === 'frozen'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-muted text-muted-foreground border-border';
    return (
      <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded-full border ${pillColor}`}>
        {card.status}
      </span>
    );
  }, [card.status]);

  useEffect(() => {
    setActivationStatus(card.activationStatus || card.status);
  }, [card.activationStatus, card.status, card.id]);

  const teardownElements = () => {
    if (mountedElements.current) {
      mountedElements.current.number?.unmount();
      mountedElements.current.cvc?.unmount();
      mountedElements.current.expiry?.unmount();
      mountedElements.current.elements = null;
      mountedElements.current = null;
    }
  };

  const sendActivationOtp = async () => {
    if (!card || activationStatus === 'ACTIVE') return;
    if (!token) return;
    if (!card.id) return;
    if (!card.bankAccountId) return;
    if (!userEmail) {
      setActivationMessage(t('cards:messages.emailRequired'));
      return;
    }
    setSendingActivation(true);
    setActivationMessage(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purpose: 'CARD_ACTIVATION',
          email: userEmail,
          cardId: card.id
        })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message = payload?.errors || payload?.message || t('cards:messages.sendFailed');
        setActivationMessage(message);
        toast.error(message);
        return;
      }
      setActivationMessage(t('cards:messages.sendSuccess'));
      toast.success(t('cards:messages.sendSuccess'));
    } catch (_err) {
      setActivationMessage(t('cards:messages.sendError'));
    } finally {
      setSendingActivation(false);
    }
  };

  const handleActivateCard = async () => {
    if (!activationCode.trim()) {
      setActivationMessage(t('cards:messages.codeRequired'));
      return;
    }
    setActivating(true);
    setActivationMessage(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/cards/${card.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify({ otpCode: activationCode.trim() })
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const message = payload?.errors || payload?.message || t('cards:messages.activateFailed');
          setActivationMessage(message);
          toast.error(message);
          return;
        }
        setActivationStatus('ACTIVE');
        setActivationMessage(t('cards:messages.activated'));
        toast.success(t('cards:messages.activated'));
        if (typeof onActivated === 'function') {
          onActivated(card.id);
        }
      } catch (_err) {
        setActivationMessage(t('cards:messages.activateError'));
      } finally {
        setActivating(false);
      }
    };
  useEffect(() => {
    return () => teardownElements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showDetails) {
      teardownElements();
      return;
    }

    let cancelled = false;

    const renderElements = async () => {
      setLoading(true);
      setError(null);

      if (!stripeKey) {
        setError(t('cards:messages.stripeMissing'));
        setLoading(false);
        return;
      }

      try {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error(t('cards:messages.stripeInitFailed'));
        }
        if (!card.stripeCardId) {
          throw new Error(t('cards:messages.cardRefMissing'));
        }

        const nonceResult = await stripe.createEphemeralKeyNonce({ issuingCard: card.stripeCardId });
        if (!nonceResult.nonce || nonceResult.error) {
          const message = nonceResult.error?.message || t('cards:messages.authError');
          throw new Error(message);
        }

        const res = await apiFetch(`${API_BASE_URL}/cards/${card.id}/ephemeral-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nonce: nonceResult.nonce })
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.secret || !payload?.issuingCardId) {
          const message = payload?.errors || payload?.message || t('cards:messages.loadFailed');
          throw new Error(message);
        }

        const issuingCardId = payload.issuingCardId || card.stripeCardId;
        const nonce = payload.nonce || nonceResult.nonce;
        if (cancelled) return;

        // Render sensitive details inside Stripe iframes; no PAN/CVC touches local state.
        const elements = stripe.elements();
        const baseStyle = {
          base: {
            color: '#0f172a',
            fontSize: '16px',
            letterSpacing: '0.12em',
            fontFamily: '"JetBrains Mono", "SFMono-Regular", Menlo, monospace',
            fontWeight: 600
          },
          invalid: {
            color: '#ef4444'
          }
        };

        const issuingElementOptions = {
          issuingCard: issuingCardId,
          ephemeralKeySecret: payload.secret,
          nonce,
          style: baseStyle
        };

        const numberEl = elements.create('issuingCardNumberDisplay', issuingElementOptions);
        const cvcEl = elements.create('issuingCardCvcDisplay', issuingElementOptions);
        const expiryEl = elements.create('issuingCardExpiryDisplay', issuingElementOptions);

        if (!numberRef.current || !cvcRef.current || !expiryRef.current) {
          throw new Error(t('cards:messages.loadFailed'));
        }

        numberEl.mount(numberRef.current);
        cvcEl.mount(cvcRef.current);
        expiryEl.mount(expiryRef.current);

        mountedElements.current = { elements, number: numberEl, cvc: cvcEl, expiry: expiryEl };
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : t('cards:messages.loadFailed');
        setError(message);
        setShowDetails(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderElements();

    return () => {
      cancelled = true;
      teardownElements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetails, card.id, card.stripeCardId, token]);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{card.brand || t('cards:labels.virtualCard')}</p>
            {statusBadge}
          </div>
          <p className="text-xs text-muted-foreground mt-1">•••• {card.last4}</p>
          <p className="text-xs text-muted-foreground">
            {t('cards:labels.linkedAccount')} {linkedAccountLast4 ? `••••${linkedAccountLast4}` : '—'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t('cards:labels.activation')} {activationStatus || '—'}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          iconName={showDetails ? 'EyeOff' : 'Eye'}
          onClick={() => setShowDetails((prev) => !prev)}
          disabled={loading}
        >
          {showDetails ? t('cards:actions.hideDetails') : t('cards:actions.showDetails')}
        </Button>
      </div>
      {activationStatus !== 'ACTIVE' && (
        <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
          <p className="text-sm font-semibold text-foreground">{t('cards:activation.title')}</p>
          <p className="text-xs text-muted-foreground">
            {t('cards:activation.description')}
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="flex-1 border border-border rounded-md px-3 py-2 bg-background text-foreground"
              placeholder={t('cards:activation.placeholder')}
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.trim())}
            />
            <Button variant="outline" onClick={sendActivationOtp} loading={sendingActivation}>
              {t('cards:actions.sendCode')}
            </Button>
            <Button onClick={handleActivateCard} loading={activating}>
              {t('cards:actions.activate')}
            </Button>
          </div>
          {activationMessage && (
            <p className="text-xs text-muted-foreground">{activationMessage}</p>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-error bg-error/5 border border-error/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div
          className="relative h-64"
          style={{ perspective: '1400px' }}
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: showDetails ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white p-5 shadow-xl border border-white/10"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">{t('cards:labels.virtualCard')}</p>
                  <p className="text-xl font-semibold">{card.brand || 'Visa'}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide border border-white/20">
                  {card.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-10">
                <span className="h-10 w-14 rounded-md bg-amber-300/90 shadow-inner" />
                <div className="text-white/70 text-sm">
                  <p>{t('cards:details.digitalAccess')}</p>
                  <p className="text-xs">{t('cards:details.securedByStripe')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-semibold tracking-[0.25em]">•••• •••• •••• {card.last4}</p>
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{t('cards:details.validThruPlaceholder')}</span>
                  <span>{t('cards:details.cvcPlaceholder')}</span>
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 text-white p-5 shadow-2xl border border-white/10"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-wide text-white/60">{t('cards:details.sensitiveHeading')}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/60">{t('cards:details.sensitiveSubheading')}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">{t('cards:details.numberLabel')}</p>
                  <div
                    ref={numberRef}
                    className="min-h-[32px] text-lg font-semibold tracking-[0.18em]"
                    aria-label={t('cards:details.numberLabel')}
                  />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <div className="bg-white/10 rounded-lg px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">{t('cards:details.expiryLabel')}</p>
                    <div
                      ref={expiryRef}
                      className="min-h-[32px] text-lg font-semibold tracking-[0.12em]"
                      aria-label={t('cards:details.expiryLabel')}
                    />
                  </div>

                  <div className="bg-white/10 rounded-lg px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">{t('cards:details.cvcLabel')}</p>
                    <div
                      ref={cvcRef}
                      className="min-h-[32px] text-lg font-semibold tracking-[0.12em]"
                      aria-label={t('cards:details.cvcLabel')}
                    />
                  </div>
                </div>
              </div>
              {loading && (
                <p className="text-xs text-white/70 mt-3">{t('cards:activation.loadingDetails')}</p>
              )}
              {!loading && (
                <p className="text-xs text-white/70 mt-3">
                  {t('cards:activation.secureNote')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsDisplay;
