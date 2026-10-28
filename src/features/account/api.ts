import "server-only";
import type { LicenseUpload, UserProfile } from "./model";
import { accountMock } from "./api.mock";

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

// The account mock remains in use until the profile API integration fractions
// replace each operation with its live implementation.
export const accountApi: AccountApi = accountMock;
