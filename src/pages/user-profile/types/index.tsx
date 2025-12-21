export interface UserProfile {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	profilePicture: string;
	profilePictureAlt: string;
	dateJoined: Date;
	lastLogin: Date;
	kycStatus?: string;
	kycDocumentType?: string;
	kycCountry?: string;
	kycUpdatedAt?: Date;
}
  
  export interface ContactPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
    transactionAlerts: boolean;
  }
  
  export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
  
export interface ProfileEditData {
	fullName: string;
	email: string;
	phone: string;
	profilePicture?: File;
}
  
  export interface ValidationErrors {
    fullName?: string;
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    profilePicture?: string;
  }
  
  export interface ProfileSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
  }
  
  export interface EditMode {
    isEditing: boolean;
    section: 'profile' | 'password' | 'preferences' | null;
  }
