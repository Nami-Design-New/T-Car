export const ACCOUNT_TABS = ['profile', 'bookings', 'wallet', 'bank-accounts', 'notifications'] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

export interface UserProfile {
  fullName: string;
  email: string;
  birthDate: string;
  phone: string;
}

export interface LicenseUpload {
  name: string;
  size: number;
  type: string;
}

export const isAccountTab = (value: unknown): value is AccountTab =>
  typeof value === 'string' && (ACCOUNT_TABS as readonly string[]).includes(value);
