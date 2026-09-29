import type { LicenseUpload, UserProfile } from '@/features/account/model';
import { accountMock } from './mocks/account';

export interface AccountApi {
  getProfile(accountId: string): Promise<UserProfile>;
  updateProfile(accountId: string, profile: UserProfile): Promise<UserProfile>;
  /** Sends a code to a new phone number; also used to resend it. */
  sendPhoneCode(accountId: string, phone: string): Promise<void>;
  /** Confirms the new phone number with the code that was sent to it. */
  verifyPhone(accountId: string, phone: string, code: string): Promise<void>;
  uploadLicense(accountId: string, file: LicenseUpload): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;
}

// The account endpoints are not available yet, so the stateless mock is the
// only implementation. Add the HTTP implementation here once they exist.
export const accountApi: AccountApi = accountMock;
