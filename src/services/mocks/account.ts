import type { UserProfile } from '@/features/account/model';
import { AppError } from '@/shared/lib/errors';
import type { AccountApi } from '../account.api';

const MOCK_PROFILE: UserProfile = {
  fullName: 'أحمد عبدالله القحطاني',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966 45 67 89',
};

// Read-only, so it is safe to run on the server. The reserved account id
// `profile-read-failure` deterministically exercises the read error path.
export const accountMock: AccountApi = {
  async getProfile(accountId) {
    if (accountId === 'profile-read-failure') throw new AppError('server');
    return { ...MOCK_PROFILE };
  },
};
