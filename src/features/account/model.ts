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

/** Each account section is its own route: /account/<section>. */
export const accountSectionPath = (section: AccountTab) => `/account/${section}` as const;

export const isAccountTab = (value: unknown): value is AccountTab =>
  typeof value === 'string' && (ACCOUNT_TABS as readonly string[]).includes(value);
