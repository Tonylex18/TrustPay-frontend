import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import ProfileSection from './components/ProfileSection';
import ProfileInfoDisplay from './components/ProfileInfoDisplay';
import ProfileEditForm from './components/ProfileEditForm';
import PasswordChangeForm from './components/PasswordChangeForm';
import ContactPreferencesForm from './components/ContactPreferencesForm';
import { UserProfile, ContactPreferences, PasswordChangeData, ProfileEditData, EditMode } from './types';
import { toast } from 'react-toastify';
import { API_BASE_URL, clearStoredToken, getStoredToken } from '../../utils/api';

const UserProfilePage = () => {
  const navigate = useNavigate();
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

  const breadcrumbItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'User Profile' }];

  useEffect(() => {
    const controller = new AbortController();
    const token = getStoredToken();

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [profileRes, kycRes] = await Promise.all([
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

    fetchProfile();

    return () => controller.abort();
  }, [navigate]);

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
