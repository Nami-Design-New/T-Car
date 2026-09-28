import type { UserProfile } from '@/features/account/model';
import { accountMock } from './mocks/account';

export interface AccountApi {
  getProfile(accountId: string): Promise<UserProfile>;
}

// The account endpoints are not available yet, so the stateless mock is the
// only implementation. Add the HTTP implementation here once they exist.
export const accountApi: AccountApi = accountMock;
