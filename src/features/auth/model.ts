/** The signed-in customer, as the session exposes it to the UI. Never includes the backend token. */
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * What is left of onboarding after the phone is verified. The backend issues a
 * full token at verification, so the session exists from then on; the app
 * gates on this step (`register` sessions cannot use the account pages).
 */
export type OnboardingStep = 'register' | 'location' | 'completed';

const ONBOARDING_STEPS: readonly string[] = ['register', 'location', 'completed'];

/**
 * The backend's `current_step`. It can be `null` for an existing user
 * (Auth-API.md Q3): without a name that is still `register`, otherwise done.
 */
export function toOnboardingStep(step: string | null, hasName: boolean): OnboardingStep {
  if (step !== null && ONBOARDING_STEPS.includes(step)) return step as OnboardingStep;
  return hasName ? 'completed' : 'register';
}

/** What the backend returns after a successful sign-in or registration. */
export interface AuthGrant {
  accessToken: string;
  user: AuthUser;
  onboardingStep: OnboardingStep;
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

/** Stable codes the OTP sign-in returns to the client. */
export const AUTH_ERROR_CODES = {
  invalidCode: 'auth.invalidCode',
} as const;
