export interface VerifiedAccount {
  fullName: string;
  email: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  routingNumber?: string;
}

export interface TransferFormData {
  accountNumber: string;
  bankName: string;
  accountHolderName: string;
  accountType?: 'checking' | 'savings';
  amount: string;
  transferType: 'internal' | 'external';
  memo: string;
}

export interface TransferSummary {
  amount: number;
  fee: number;
  total: number;
  processingTime: string;
  exchangeRate?: number;
}

export interface TransferLimits {
  dailyLimit: number;
  perTransactionLimit: number;
  remainingToday: number;
  spentToday: number;
  availableBalance: number;
  currency: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  accountType: string;
  routingNumber?: string;
}
