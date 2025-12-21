export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type ValidationErrors = Partial<Record<keyof LoginFormData, string>>;

export interface SecurityTip {
  title: string;
  description: string;
  icon: string;
}
