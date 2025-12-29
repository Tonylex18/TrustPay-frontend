export interface RegistrationFormData {
	email: string;
	password: string;
	confirmPassword: string;
	agreeToTerms: boolean;
	agreeToPrivacy: boolean;
}

export interface ValidationErrors {
	email?: string;
	password?: string;
	confirmPassword?: string;
	agreeToTerms?: string;
	agreeToPrivacy?: string;
	otp?: string;
}
  
  export interface PasswordStrength {
    score: number;
    label: string;
    color: string;
    requirements: PasswordRequirement[];
  }
  
  export interface PasswordRequirement {
    label: string;
    met: boolean;
  }
  
  export interface RegistrationStepProps {
    formData: RegistrationFormData;
    errors: ValidationErrors;
    onInputChange: (field: keyof RegistrationFormData, value: string | boolean) => void;
  }
