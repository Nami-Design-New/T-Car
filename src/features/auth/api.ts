import type { AuthGrant, RegistrationInput } from './model';
import { authMock } from './api.mock';

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

// Still the mock until the endpoints are wired fraction by fraction (A4–A7 in
// docs/api/Auth-API.md). The http implementation replaces it here, without a
// mock flag; the mock then stays for tests only. Callers stay unchanged.
// Assumption to confirm with the backend: registration re-sends the verified
// phone and code. If it returns a registration token from verifyOtp instead,
// only this file, the mock, and the sign-in provider change.
export const authApi: AuthApi = authMock;
