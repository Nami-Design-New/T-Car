import { NATIONAL_NUMBER_DIGITS, toNationalNumber } from '@/shared/lib/phone';
export { NATIONAL_NUMBER_DIGITS, toNationalNumber } from '@/shared/lib/phone';

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

export { MIN_AGE, isOldEnough } from '@/shared/lib/validation';

export function isNationalNumber(phone: string): boolean {
  if (!/^[\d\s-]+$/.test(phone)) return false;
  const digits = toNationalNumber(phone).length;
  return digits >= NATIONAL_NUMBER_DIGITS.min && digits <= NATIONAL_NUMBER_DIGITS.max;
}

/** Stable codes the OTP sign-in returns to the client. */
export const AUTH_ERROR_CODES = {
  invalidCode: 'auth.invalidCode',
} as const;
