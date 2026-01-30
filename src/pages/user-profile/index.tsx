import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import ProfileSection from './components/ProfileSection';
import ProfileInfoDisplay from './components/ProfileInfoDisplay';
import ProfileEditForm from './components/ProfileEditForm';
import PasswordChangeForm from './components/PasswordChangeForm';
import ContactPreferencesForm from './components/ContactPreferencesForm';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CardDetailsDisplay from './components/CardDetailsDisplay';
import { UserProfile, ContactPreferences, PasswordChangeData, ProfileEditData, EditMode } from './types';
import { toast } from 'react-toastify';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('profile');
  const token = getStoredToken();
  const [editMode, setEditMode] = useState<EditMode>({
    isEditing: false,
    section: null
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [contactPreferences, setContactPreferences] = useState<ContactPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    promotionalEmails: false,
    transactionAlerts: true
  });
  type CardRequestSummary = {
    id: string;
    status: string;
    bankAccountId: string;
    feeStatus?: string;
    rejectionReason?: string | null;
    accountLast4?: string;
    cardId?: string | null;
    createdAt?: string;
  };
  type TransferLimitRequestSummary = {
    id: string;
    status: string;
    currentLimit: number;
    requestedLimit: number;
    reason?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  const [cards, setCards] = useState<
    { id: string; brand: string; last4: string; status: string; bankAccountId: string; createdAt: string; stripeCardId?: string; activationStatus?: string; activatedAt?: string }[]
  >([]);
  const [accounts, setAccounts] = useState<
    { id: string; accountNumber: string; type?: string; status?: string; availableBalance?: number }[]
  >([]);
  const [cardRequests, setCardRequests] = useState<CardRequestSummary[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardRequestError, setCardRequestError] = useState<string | null>(null);
  const [dailyTransferLimit, setDailyTransferLimit] = useState<number | null>(null);
  const [transferLimitRequests, setTransferLimitRequests] = useState<TransferLimitRequestSummary[]>([]);
  const [transferLimitLoadError, setTransferLimitLoadError] = useState<string | null>(null);
  const [transferLimitSubmitError, setTransferLimitSubmitError] = useState<string | null>(null);
  const [transferLimitSubmitting, setTransferLimitSubmitting] = useState(false);
  const [transferLimitForm, setTransferLimitForm] = useState({ requestedLimit: '', reason: '' });
  const [isLoadingTransferLimitRequests, setIsLoadingTransferLimitRequests] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const selectedAccount = useMemo(
    () => accounts.find((acct) => acct.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );
  const hasIssuedCard = useMemo(
    () => cards.some((card) => card.bankAccountId === selectedAccountId),
    [cards, selectedAccountId]
  );
  const hasPendingRequest = useMemo(
    () => cardRequests.some((r) => ['PENDING_APPROVAL', 'APPROVED'].includes((r.status || '').toUpperCase())),
    [cardRequests]
  );
  const insufficientBalance = useMemo(() => {
    const balance = selectedAccount?.availableBalance ?? 0;
    return balance < 5;
  }, [selectedAccount]);
  const latestTransferLimitRequest = useMemo(
    () => (transferLimitRequests.length > 0 ? transferLimitRequests[0] : null),
    [transferLimitRequests]
  );
  const isTransferLimitPending = (latestTransferLimitRequest?.status || '').toUpperCase() === 'PENDING';
  const currentDailyLimit = useMemo(() => {
    if (typeof dailyTransferLimit === 'number') {
      return dailyTransferLimit;
    }
    if (
      latestTransferLimitRequest &&
      (latestTransferLimitRequest.status || '').toUpperCase() === 'APPROVED' &&
      typeof latestTransferLimitRequest.requestedLimit === 'number'
    ) {
      return latestTransferLimitRequest.requestedLimit;
    }
    if (typeof latestTransferLimitRequest?.currentLimit === 'number') {
      return latestTransferLimitRequest.currentLimit;
    }
    return 10000;
  }, [dailyTransferLimit, latestTransferLimitRequest]);

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat(i18n.language || 'en-US', { style: 'currency', currency: 'USD' }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const handleCardActivated = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, status: 'ACTIVE', activationStatus: 'ACTIVE' } : c
      )
    );
  };

  const breadcrumbItems = [
  { label: t('breadcrumb.dashboard'), path: '/dashboard' },
  { label: t('breadcrumb.profile') }];
  const kycApproved = userProfile?.kycStatus === 'APPROVED';
  const profilePictureAltText = userProfile
    ? t('profile.pictureAlt', { name: userProfile.fullName || userProfile.email })
    : '';

  useEffect(() => {
    const controller = new AbortController();

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [profileRes, kycRes, meRes] = await Promise.all([
          fetch(`${API_BASE_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/kyc/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          })
        ]);

        const payload = await profileRes.json().catch(() => null);
        if (!profileRes.ok) {
          const message = payload?.errors || payload?.message || t('profile.loadError');
          if (profileRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setLoadError(message);
          toast.error(message);
          return;
        }

        const kycPayload = await kycRes.json().catch(() => null);
        const mePayload = await meRes.json().catch(() => null);

        if (!meRes.ok) {
          const message = mePayload?.errors || mePayload?.message || t('profile.loadError');
          if (meRes.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setLoadError(message);
          toast.error(message);
          return;
        }

        const meData = mePayload?.user || mePayload?.data || mePayload;
        if (typeof meData?.dailyTransferLimit === 'number') {
          setDailyTransferLimit(meData.dailyTransferLimit);
        }

        const data = payload?.user || payload?.data || payload;
        const kyc = kycPayload?.kyc;

        if (!data) {
          const message = t('profile.dataMissing');
          setLoadError(message);
          toast.error(message);
          return;
        }

        setUserProfile({
          id: data.id,
          fullName: kyc?.firstName ? `${kyc.firstName} ${kyc.lastName || ''}`.trim() : (data.fullName || data.email),
          email: data.email,
          phone: data.phone || '',
          profilePicture: data.avatarUrl || '',
          profilePictureAlt: t('profile.pictureAlt', { name: data.fullName || data.email }),
          dateJoined: data.createdAt ? new Date(data.createdAt) : new Date(),
          lastLogin: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date(),
          kycStatus: kyc?.status || data.kycStatus || 'UNKNOWN',
          kycDocumentType: kyc?.documentType,
          kycCountry: kyc?.country,
          kycUpdatedAt: kyc?.updatedAt ? new Date(kyc.updatedAt) : undefined,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = t('profile.loadError');
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCardsAndAccounts = async () => {
      setCardLoading(true);
      setCardError(null);
      setCardRequestError(null);
      try {
        const [cardRes, accountRes, requestRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cards`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/accounts`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          fetch(`${API_BASE_URL}/card-requests`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          })
        ]);

        const cardPayload = await cardRes.json().catch(() => null);
        const accountPayload = await accountRes.json().catch(() => null);
        const requestPayload = await requestRes.json().catch(() => null);

        if (cardRes.ok && Array.isArray(cardPayload)) {
          setCards(
            cardPayload.map((c: any) => ({
              id: c.id,
              brand: c.brand,
              last4: c.last4,
              status: c.status,
              bankAccountId: c.bankAccountId,
              createdAt: c.createdAt,
              stripeCardId: c.stripeCardId,
              activationStatus: c.activationStatus,
              activatedAt: c.activatedAt
            }))
          );
        } else if (!cardRes.ok) {
          const message = cardPayload?.errors || cardPayload?.message || t('cards.loadError');
          setCardError(message);
          toast.error(message);
        }

        if (accountRes.ok && Array.isArray(accountPayload)) {
          setAccounts(
            accountPayload.map((a: any) => ({
              id: a.id,
              accountNumber: a.account_number || a.accountNumber,
              type: a.type || a.account_type || a.accountType,
              status: a.status,
              availableBalance: a.available_balance ?? a.availableBalance ?? a.balance ?? 0
            }))
          );
          if (!selectedAccountId && Array.isArray(accountPayload) && accountPayload.length > 0) {
            setSelectedAccountId(accountPayload[0].id);
          }
        }

        if (requestRes.ok && Array.isArray(requestPayload)) {
          setCardRequests(
            requestPayload.map((r: any) => ({
              id: r.id,
              status: r.status,
              bankAccountId: r.bankAccountId,
              feeStatus: r.feeStatus || r.fee_status,
              rejectionReason: r.rejectionReason || r.rejection_reason,
              accountLast4: r.accountLast4 || r.account_last4,
              cardId: r.cardId || r.card_id,
              createdAt: r.createdAt || r.created_at
            }))
          );
        } else if (!requestRes.ok) {
          const message = requestPayload?.errors || requestPayload?.message || t('cards.requestsLoadError');
          setCardRequestError(message);
          toast.error(message);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCardError(t('cards.loadError'));
          toast.error(t('cards.loadError'));
        }
      } finally {
        setCardLoading(false);
      }
    };

    fetchProfile();
    fetchCardsAndAccounts();
    const fetchTransferLimitRequests = async () => {
      setIsLoadingTransferLimitRequests(true);
      setTransferLimitLoadError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/transfer-limit-requests`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message = payload?.errors || payload?.message || t('sections.transferLimit.loadError');
          if (response.status === 401) {
            clearStoredToken();
            navigate('/login');
            return;
          }
          setTransferLimitLoadError(message);
          toast.error(message);
          return;
        }
        if (Array.isArray(payload)) {
          setTransferLimitRequests(
            payload.map((r: any) => ({
              id: r.id,
              status: r.status,
              currentLimit: Number(r.currentLimit ?? r.current_limit ?? 0),
              requestedLimit: Number(r.requestedLimit ?? r.requested_limit ?? 0),
              reason: r.reason || null,
              createdAt: r.createdAt || r.created_at,
              updatedAt: r.updatedAt || r.updated_at
            }))
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setTransferLimitLoadError(t('sections.transferLimit.loadError'));
          toast.error(t('sections.transferLimit.loadError'));
        }
      } finally {
        setIsLoadingTransferLimitRequests(false);
      }
    };
    fetchTransferLimitRequests();

    return () => controller.abort();
  }, [navigate, token]);

  const handleEditProfile = () => {
    setEditMode({ isEditing: true, section: 'profile' });
  };

  const handleEditPassword = () => {
    setEditMode({ isEditing: true, section: 'password' });
  };

  const handleCancelEdit = () => {
    setEditMode({ isEditing: false, section: null });
  };

  const handleSaveProfile = (data: ProfileEditData) => {
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone
          }
        : prev
    );
    setEditMode({ isEditing: false, section: null });
    toast.success(t('profile.updated'))
    // alert('Profile updated successfully!');
  };

  const handleSavePassword = (data: PasswordChangeData) => {
    setEditMode({ isEditing: false, section: null });
    alert(t('password.changed'));
  };

  const handleSavePreferences = (preferences: ContactPreferences) => {
    setContactPreferences(preferences);
    toast.success(t('preferences.updated'));
    // alert('Contact preferences updated successfully!');
  };

  const handleRequestCard = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedAccountId) {
      toast.error(t('cards.selectAccountError'));
      return;
    }
    setCardLoading(true);
    setCardError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cards`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bankAccountId: selectedAccountId })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || t('cards.requestFailed');
        setCardError(message);
        toast.error(message);
        return;
      }
      const newRequest: CardRequestSummary = {
        id: payload?.requestId || payload?.id,
        status: payload?.status,
        bankAccountId: payload?.bankAccountId,
        feeStatus: payload?.feeStatus,
        rejectionReason: payload?.rejectionReason,
        accountLast4: payload?.accountLast4,
        cardId: payload?.cardId,
        createdAt: payload?.createdAt
      };
      if (newRequest.id) {
        setCardRequests((prev) => [newRequest, ...prev.filter((r) => r.id !== newRequest.id)]);
      }
      toast.success(payload?.message || t('cards.reviewNote'));
    } catch (error) {
      setCardError(t('cards.requestFailed'));
      toast.error(t('cards.requestFailed'));
    } finally {
      setCardLoading(false);
    }
  };

  const handleTransferLimitSubmit = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (isTransferLimitPending) {
      return;
    }
    const requestedValue = Number(transferLimitForm.requestedLimit);
    const reason = transferLimitForm.reason.trim();

    if (!requestedValue || Number.isNaN(requestedValue)) {
      setTransferLimitSubmitError(t('sections.transferLimit.errors.requested'));
      return;
    }
    if (requestedValue <= currentDailyLimit) {
      setTransferLimitSubmitError(t('sections.transferLimit.errors.increaseRequired'));
      return;
    }
    if (!reason) {
      setTransferLimitSubmitError(t('sections.transferLimit.errors.reason'));
      return;
    }

    setTransferLimitSubmitting(true);
    setTransferLimitSubmitError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/transfer-limit-requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestedLimit: requestedValue,
          reason
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || t('sections.transferLimit.errors.submitFailed');
        setTransferLimitSubmitError(message);
        toast.error(message);
        return;
      }
      const created = payload as TransferLimitRequestSummary;
      setTransferLimitRequests((prev) => [
        {
          id: created.id,
          status: created.status,
          currentLimit: Number(created.currentLimit),
          requestedLimit: Number(created.requestedLimit),
          reason: created.reason || null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        },
        ...prev.filter((r) => r.id !== created.id)
      ]);
      setTransferLimitForm({ requestedLimit: '', reason: '' });
      toast.success(t('sections.transferLimit.success'));
    } catch (_error) {
      setTransferLimitSubmitError(t('sections.transferLimit.errors.submitUnavailable'));
    } finally {
      setTransferLimitSubmitting(false);
    }
  };

  const renderTransferLimitBadge = (status?: string) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'REJECTED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-error/10 text-error border-error/30">
          {t('sections.transferLimit.status.rejected')}
        </span>
      );
    }
    if (normalized === 'APPROVED') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-success/10 text-success border-success/30">
          {t('sections.transferLimit.status.approved')}
        </span>
      );
    }
    if (normalized === 'PENDING') {
      return (
        <span className="px-2 py-1 text-[11px] font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
          {t('sections.transferLimit.status.pending')}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{t('metaTitle')}</title>
        <meta name="description" content={t('metaDescription')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <NavigationBar
          user={
            userProfile
              ? {
                  name: userProfile.fullName,
                  email: userProfile.email,
                  avatar: userProfile.profilePicture
                }
              : undefined
          }
          onNavigate={(path) => {}} />


        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-7xl mx-auto">
              <BreadcrumbTrail items={breadcrumbItems} className="mb-6" />

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
                <p className="text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ProfileSection
                    title={t('sections.profileInfo.title')}
                    description={t('sections.profileInfo.description')}>

                    {isLoading && (
                      <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                        {t('profile.loading')}
                      </div>
                    )}

                    {!isLoading && loadError && (
                      <div className="rounded-lg border border-error/20 bg-error/5 p-6 text-sm text-error">
                        {loadError}
                      </div>
                    )}

                    {!isLoading && !loadError && userProfile && (
                      <>
                        {editMode.isEditing && editMode.section === 'profile' ? (
                          <ProfileEditForm
                            initialData={{
                              fullName: userProfile.fullName,
                              email: userProfile.email,
                              phone: userProfile.phone
                            }}
                            currentPicture={userProfile.profilePicture}
                            currentPictureAlt={profilePictureAltText}
                            onSave={handleSaveProfile}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          <ProfileInfoDisplay
                            profile={userProfile}
                            onEdit={handleEditProfile}
                          />
                        )}
                      </>
                    )}
                  </ProfileSection>


                  <ProfileSection
                    title={t('sections.cards.title')}
                    description={t('sections.cards.description')}
                  >
                    {cardLoading && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        {t('cards.loading')}
                      </div>
                    )}
                    {cardError && (
                      <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
                        {cardError}
                      </div>
                    )}
                    {cardRequestError && (
                      <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
                        {cardRequestError}
                      </div>
                    )}
                    {!cardLoading && cardRequests.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {cardRequests.map((request) => {
                          const badge = (() => {
                            const normalized = (request.status || '').toUpperCase();
                            if (normalized === 'REJECTED') {
                              return 'bg-error/10 text-error border-error/30';
                            }
                            if (normalized === 'APPROVED' || normalized === 'ISSUED') {
                              return 'bg-success/10 text-success border-success/30';
                            }
                            return 'bg-amber-50 text-amber-700 border-amber-200';
                          })();
                          const label = (() => {
                            const normalized = (request.status || '').toUpperCase();
                            if (normalized === 'REJECTED') return t('cards.status.rejected');
                            if (normalized === 'APPROVED') return t('cards.status.approved');
                            if (normalized === 'ISSUED') return t('cards.status.issued');
                            return t('cards.status.pending');
                          })();
                          return (
                            <div key={request.id} className="border border-border rounded-lg p-4 bg-muted/20">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{t('cards.requestTitle')}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t('cards.accountLine', { last4: request.accountLast4 || '----' })}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {t('cards.feeStatus', {
                                      status: (request.feeStatus || 'PENDING').toString().replace(/_/g, ' ')
                                    })}
                                  </p>
                                  {request.rejectionReason && (
                                    <p className="text-xs text-error mt-1">
                                      {t('cards.reason', { reason: request.rejectionReason })}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 text-[11px] font-semibold rounded-full border ${badge}`}>
                                  {label}
                                </span>
                              </div>
                              {(request.status || '').toUpperCase() === 'PENDING_APPROVAL' && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {t('cards.reviewNote')}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {token && !cardLoading && cards.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {cards.map((card) => {
                          const account = accounts.find((a) => a.id === card.bankAccountId);
                          const accountLast4 = account?.accountNumber
                            ? account.accountNumber.slice(-4)
                            : undefined;
                          return (
                            <CardDetailsDisplay
                              key={card.id}
                              card={card}
                              token={token!}
                              linkedAccountLast4={accountLast4}
                              userEmail={userProfile?.email}
                              onActivated={handleCardActivated}
                            />
                          );
                        })}
                      </div>
                    )}
                    {!cardLoading && cards.length === 0 && (
                      <p className="text-sm text-muted-foreground mb-3">{t('cards.noCard')}</p>
                    )}
                    {kycApproved ? (
                      accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('cards.noAccounts')}</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="border border-border rounded-lg p-3 bg-card/40">
                            <p className="text-sm font-semibold text-foreground">{t('cards.feeTitle')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('cards.feeBody')}
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-2">{t('cards.processingTitle')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('cards.processingBody')}
                            </p>
                          </div>
                          <Select
                            label={t('cards.selectFunding')}
                            value={selectedAccountId}
                            onChange={(value) => setSelectedAccountId(String(value))}
                            options={accounts.map((acct) => ({
                              label: `${(acct.type || 'Account').toUpperCase()} ••••${(acct.accountNumber || '').slice(-4)}`,
                              value: acct.id
                            }))}
                          />
                          <Button
                            onClick={handleRequestCard}
                            loading={cardLoading}
                            disabled={cardLoading || hasPendingRequest || insufficientBalance || hasIssuedCard}
                          >
                            {hasPendingRequest ? t('cards.requestPending') : t('cards.requestButton')}
                          </Button>
                          {(hasPendingRequest || insufficientBalance || hasIssuedCard) && (
                            <p className="text-xs text-muted-foreground">
                              {insufficientBalance
                                ? t('cards.needBalance')
                                : hasPendingRequest
                                  ? t('cards.pendingRequest')
                                  : t('cards.existingCard')}
                            </p>
                          )}
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('cards.kycRequired')}
                      </p>
                    )}
                  </ProfileSection>
                  
                  



                  <ProfileSection
                    title={t('sections.security.title')}
                    description={t('sections.security.description')}>

                    {editMode.isEditing && editMode.section === 'password' ?
                    <PasswordChangeForm
                      onSave={handleSavePassword}
                      onCancel={handleCancelEdit} /> :


                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-foreground">{t('sections.security.password')}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('sections.security.passwordLastChanged', {
                              date: new Intl.DateTimeFormat(i18n.language || 'en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            }).format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                            })}
                            </p>
                          </div>
                          <button
                          onClick={handleEditPassword}
                          className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors duration-200">

                            {t('sections.security.changePassword')}
                          </button>
                        </div>

                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-success">{t('sections.security.twoFactorTitle')}</p>
                              <p className="text-sm text-success/80 mt-1">
                                {t('sections.security.twoFactorBody')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </ProfileSection>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <ProfileSection
                    title={t('sections.contact.title')}
                    description={t('sections.contact.description')}>

                    <ContactPreferencesForm
                      initialPreferences={contactPreferences}
                      onSave={handleSavePreferences} />

                  </ProfileSection>
                  <ProfileSection
                    title={t('sections.transferLimit.title')}
                    description={t('sections.transferLimit.description')}
                  >
                    {isLoadingTransferLimitRequests && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        {t('sections.transferLimit.loading')}
                      </div>
                    )}
                    {transferLimitLoadError && (
                      <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
                        {transferLimitLoadError}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t('sections.transferLimit.currentLimitTitle')}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(currentDailyLimit)}
                          </p>
                        </div>
                        {latestTransferLimitRequest ? renderTransferLimitBadge(latestTransferLimitRequest.status) : null}
                      </div>

                      {latestTransferLimitRequest && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{t('sections.transferLimit.requestedLimit', { amount: formatCurrency(latestTransferLimitRequest.requestedLimit) })}</p>
                          <p>{t('sections.transferLimit.reasonLabel', { reason: latestTransferLimitRequest.reason || t('sections.transferLimit.noReason') })}</p>
                          {(latestTransferLimitRequest.status || '').toUpperCase() === 'PENDING' && (
                            <p>{t('sections.transferLimit.pendingNote')}</p>
                          )}
                          {(latestTransferLimitRequest.status || '').toUpperCase() === 'APPROVED' && (
                            <p className="text-success">{t('sections.transferLimit.approvedNote')}</p>
                          )}
                          {(latestTransferLimitRequest.status || '').toUpperCase() === 'REJECTED' && (
                            <p className="text-error">{t('sections.transferLimit.rejectedNote')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      <Input
                        label={t('sections.transferLimit.requestedInput')}
                        type="number"
                        min="0"
                        step="0.01"
                        value={transferLimitForm.requestedLimit}
                        onChange={(e) =>
                          setTransferLimitForm((prev) => ({ ...prev, requestedLimit: e.target.value }))
                        }
                        disabled={isTransferLimitPending || transferLimitSubmitting}
                      />
                      <Input
                        label={t('sections.transferLimit.reasonInput')}
                        value={transferLimitForm.reason}
                        onChange={(e) =>
                          setTransferLimitForm((prev) => ({ ...prev, reason: e.target.value }))
                        }
                        disabled={isTransferLimitPending || transferLimitSubmitting}
                      />
                      {transferLimitSubmitError && (
                        <p className="text-xs text-error">{transferLimitSubmitError}</p>
                      )}
                      <Button
                        variant="default"
                        fullWidth
                        loading={transferLimitSubmitting}
                        disabled={isTransferLimitPending || transferLimitSubmitting}
                        onClick={handleTransferLimitSubmit}
                      >
                        {isTransferLimitPending ? t('sections.transferLimit.pendingButton') : t('sections.transferLimit.submitButton')}
                      </Button>
                    </div>
                  </ProfileSection>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>);

};

export default UserProfilePage;
