import type { AuthGrant, RegistrationInput } from '@/features/auth/model';
import { authMock } from './mocks/auth';

export interface AuthApi {
  /** Sends a one-time code to the phone (WhatsApp). */
  sendOtp(phone: string): Promise<void>;
  /**
   * Signs an existing customer in. Throws a `validation` AppError with code
   * `auth.invalidCode` for a wrong code, and a `conflict` AppError with code
   * `auth.registrationRequired` when the phone has no account yet.
   */
  verifyOtp(phone: string, code: string): Promise<AuthGrant>;
  /** Creates the account for a verified phone and signs it in. */
  register(input: RegistrationInput): Promise<AuthGrant>;
}

// The auth endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
// Assumption to confirm with the backend: registration re-sends the verified
// phone and code. If it returns a registration token from verifyOtp instead,
// only this file, the mock, and the sign-in provider change.
export const authApi: AuthApi = authMock;
