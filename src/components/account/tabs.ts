export const ACCOUNT_TABS = ['profile', 'bookings', 'wallet', 'bank-accounts', 'notifications'] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

export const isAccountTab = (value: unknown): value is AccountTab =>
  typeof value === 'string' && (ACCOUNT_TABS as readonly string[]).includes(value);
