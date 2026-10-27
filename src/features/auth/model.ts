/** The signed-in customer, as the session exposes it to the UI. Never includes the backend token. */
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * What is left of onboarding after the phone is verified. The backend issues a
 * full token at verification, but the session starts only after `register`:
 * until then the token waits in the pending-registration cookie.
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

/**
 * The profile a new customer fills in after verifying their phone. The signed-in
 * session identifies them, so no phone or code travels with it.
 */
export interface CompleteProfileInput {
  fullName: string;
  email: string;
  /** YYYY-MM-DD */
  birthDate: string;
}

/** The customer's location, the last onboarding step (`POST /assign-location`). */
export interface AssignLocationInput {
  latitude: number;
  longitude: number;
  addressName: string;
  region: string;
}

/** What profile completion returns: the updated user, what is left, and the backend's message. */
export interface ProfileStepResult {
  user: AuthUser;
  onboardingStep: OnboardingStep;
  message: string;
}

/** The backend's minimum age for an account (`POST /complete-profile`). */
export const MIN_AGE = 18;

/** Whether someone born on `birthDate` (YYYY-MM-DD) is at least `MIN_AGE` today (UTC). */
export function isOldEnough(birthDate: string, now: Date = new Date()): boolean {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return false;
  const adulthood = Date.UTC(year + MIN_AGE, month - 1, day);
  return adulthood <= now.getTime();
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
