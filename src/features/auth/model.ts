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

/** Stable codes the OTP sign-in returns to the client (they end up in a URL, so no details). */
export const AUTH_ERROR_CODES = {
  invalidCode: 'auth.invalidCode',
  registrationRequired: 'auth.registrationRequired',
} as const;
