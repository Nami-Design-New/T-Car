/** The signed-in customer, as the session exposes it to the UI. Never includes the backend token. */
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/** What the backend returns after a successful sign-in or registration. */
export interface AuthGrant {
  accessToken: string;
  user: AuthUser;
}

/** The profile a new customer fills in after verifying their phone. */
export interface RegistrationInput {
  phone: string;
  code: string;
  fullName: string;
  email: string;
  birthDate: string;
}

/** Digits the backend accepts in a national number (`POST /auth/request-otp`). */
export const NATIONAL_NUMBER_DIGITS = { min: 8, max: 15 };

/**
 * The national number as it is sent to the API: digits only, without the
 * trunk `0` ("0544…" → "544…"). The backend stores what it receives, so
 * "0544…" and "544…" would otherwise be two accounts (Auth-API.md Q11).
 */
export function toNationalNumber(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0+/, '');
}

export function isNationalNumber(phone: string): boolean {
  if (!/^[\d\s-]+$/.test(phone)) return false;
  const digits = toNationalNumber(phone).length;
  return digits >= NATIONAL_NUMBER_DIGITS.min && digits <= NATIONAL_NUMBER_DIGITS.max;
}

/** Stable codes the OTP sign-in returns to the client (they end up in a URL, so no details). */
export const AUTH_ERROR_CODES = {
  invalidCode: 'auth.invalidCode',
  registrationRequired: 'auth.registrationRequired',
} as const;
