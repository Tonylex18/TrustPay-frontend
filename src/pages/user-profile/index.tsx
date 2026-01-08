import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import ProfileSection from './components/ProfileSection';
import ProfileInfoDisplay from './components/ProfileInfoDisplay';
import ProfileEditForm from './components/ProfileEditForm';
import PasswordChangeForm from './components/PasswordChangeForm';
import ContactPreferencesForm from './components/ContactPreferencesForm';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import CardDetailsDisplay from './components/CardDetailsDisplay';
import { UserProfile, ContactPreferences, PasswordChangeData, ProfileEditData, EditMode } from './types';
import { toast } from 'react-toastify';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';
import { apiFetch } from 'utils/apiFetch';

const UserProfilePage = () => {
  const navigate = useNavigate();
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

  const handleCardActivated = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, status: 'ACTIVE', activationStatus: 'ACTIVE' } : c
      )
    );
  };

  const breadcrumbItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'User Profile' }];
  const kycApproved = userProfile?.kycStatus === 'APPROVED';

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
        const [profileRes, kycRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/kyc/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          })
        ]);

        const payload = await profileRes.json().catch(() => null);
        if (!profileRes.ok) {
          const message = payload?.errors || payload?.message || 'Unable to load your profile.';
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

        const data = payload?.user || payload?.data || payload;
        const kyc = kycPayload?.kyc;

        if (!data) {
          const message = 'Profile data was missing.';
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
          profilePictureAlt: `Profile photo of ${data.fullName || data.email}`,
          dateJoined: data.createdAt ? new Date(data.createdAt) : new Date(),
          lastLogin: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date(),
          kycStatus: kyc?.status || data.kycStatus || 'UNKNOWN',
          kycDocumentType: kyc?.documentType,
          kycCountry: kyc?.country,
          kycUpdatedAt: kyc?.updatedAt ? new Date(kyc.updatedAt) : undefined,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = 'Unable to load your profile.';
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
          apiFetch(`${API_BASE_URL}/cards`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/accounts`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }),
          apiFetch(`${API_BASE_URL}/card-requests`, {
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
          const message = cardPayload?.errors || cardPayload?.message || 'Unable to load cards.';
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
          const message = requestPayload?.errors || requestPayload?.message || 'Unable to load card requests.';
          setCardRequestError(message);
          toast.error(message);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCardError('Unable to load cards.');
          toast.error('Unable to load cards.');
        }
      } finally {
        setCardLoading(false);
      }
    };

    fetchProfile();
    fetchCardsAndAccounts();

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
    toast.success('Profile updated successfully')
    // alert('Profile updated successfully!');
  };

  const handleSavePassword = (data: PasswordChangeData) => {
    setEditMode({ isEditing: false, section: null });
    alert('Password changed successfully! Please use your new password for future logins.');
  };

  const handleSavePreferences = (preferences: ContactPreferences) => {
    setContactPreferences(preferences);
    toast.success('Contact preferences updated successfully!');
    // alert('Contact preferences updated successfully!');
  };

  const handleRequestCard = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Select an account to fund your card.');
      return;
    }
    setCardLoading(true);
    setCardError(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/cards`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bankAccountId: selectedAccountId })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to submit your card request right now.';
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
      toast.success(payload?.message || 'Your card request is under review. This typically takes 2–3 business days.');
    } catch (error) {
      setCardError('Unable to submit your card request right now.');
      toast.error('Unable to submit your card request right now.');
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>User Profile - TrustPay</title>
        <meta name="description" content="Manage your TrustPay account profile, security settings, and communication preferences" />
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
                <h1 className="text-3xl font-bold text-foreground mb-2">User Profile</h1>
                <p className="text-muted-foreground">
                  Manage your account information, security settings, and communication preferences
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ProfileSection
                    title="Profile Information"
                    description="View and update your personal information">

                    {isLoading && (
                      <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                        Loading profile details...
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
                            currentPictureAlt={userProfile.profilePictureAlt}
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
                    title="Cards"
                    description="Issue a virtual card that spends against your TrustPay balance"
                  >
                    {cardLoading && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Checking your card status...
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
                            if (normalized === 'REJECTED') return 'Rejected';
                            if (normalized === 'APPROVED') return 'Approved';
                            if (normalized === 'ISSUED') return 'Issued';
                            return 'Pending Approval';
                          })();
                          return (
                            <div key={request.id} className="border border-border rounded-lg p-4 bg-muted/20">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Virtual Card Request</p>
                                  <p className="text-xs text-muted-foreground">
                                    Account ••••{request.accountLast4 || '----'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Fee status: {(request.feeStatus || 'PENDING').toString().replace(/_/g, ' ')}
                                  </p>
                                  {request.rejectionReason && (
                                    <p className="text-xs text-error mt-1">
                                      Reason: {request.rejectionReason}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 text-[11px] font-semibold rounded-full border ${badge}`}>
                                  {label}
                                </span>
                              </div>
                              {label === 'Pending Approval' && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Your card request is under review. This typically takes 2–3 business days.
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
                      <p className="text-sm text-muted-foreground mb-3">You have not issued a virtual card yet.</p>
                    )}
                    {kycApproved ? (
                      accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Create a checking account to fund your card.</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="border border-border rounded-lg p-3 bg-card/40">
                            <p className="text-sm font-semibold text-foreground">Virtual Card Fee</p>
                            <p className="text-sm text-muted-foreground">
                              A one-time $5 issuance fee will be deducted from your balance when you apply.
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-2">Processing Time</p>
                            <p className="text-sm text-muted-foreground">
                              Card requests are reviewed within 2–3 business days.
                            </p>
                          </div>
                          <Select
                            label="Select funding account"
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
                            {hasPendingRequest ? 'Request pending review' : 'Request virtual card'}
                          </Button>
                          {(hasPendingRequest || insufficientBalance || hasIssuedCard) && (
                            <p className="text-xs text-muted-foreground">
                              {insufficientBalance
                                ? 'You need at least $5 available to apply.'
                                : hasPendingRequest
                                  ? 'You already have a request awaiting approval.'
                                  : 'A card is already linked to this account.'}
                            </p>
                          )}
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Your KYC must be approved before requesting a card.
                      </p>
                    )}
                  </ProfileSection>

                  <ProfileSection
                    title="Security Settings"
                    description="Manage your password and account security">

                    {editMode.isEditing && editMode.section === 'password' ?
                    <PasswordChangeForm
                      onSave={handleSavePassword}
                      onCancel={handleCancelEdit} /> :


                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-foreground">Password</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Last changed on {new Intl.DateTimeFormat('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            }).format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
                            </p>
                          </div>
                          <button
                          onClick={handleEditPassword}
                          className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors duration-200">

                            Change Password
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
                              <p className="font-medium text-success">Two-Factor Authentication Enabled</p>
                              <p className="text-sm text-success/80 mt-1">
                                Your account is protected with an additional layer of security
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </ProfileSection>
                </div>

                <div className="lg:col-span-1">
                  <ProfileSection
                    title="Contact Preferences"
                    description="Choose how you want to hear from us">

                    <ContactPreferencesForm
                      initialPreferences={contactPreferences}
                      onSave={handleSavePreferences} />

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
