import type { UserProfile } from '@/features/account/model';
import { AppError } from '@/shared/lib/errors';
import type { AccountApi } from '../account.api';
import { MOCK_OTP_CODE } from './auth';

const MOCK_PROFILE: UserProfile = {
  fullName: 'أحمد عبدالله القحطاني',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
  phone: '+966 45 67 89',
};

// Stateless, so it is safe to run on the server. Writes validate and return
// their result without retaining it between users. The reserved account id
// `profile-read-failure` deterministically exercises the read error path.
export const accountMock: AccountApi = {
  async getProfile(accountId) {
    if (accountId === 'profile-read-failure') throw new AppError('server');
    return { ...MOCK_PROFILE };
  },

  async updateProfile(_accountId, profile) {
    // `fail@tcar.test` deterministically exercises validation without keeping server state.
    if (profile.email === 'fail@tcar.test') {
      throw new AppError('validation', 'account.profileRejected', undefined, {
        email: 'account.profileRejected',
      });
    }
    return { ...profile };
  },

  async sendPhoneCode(_accountId, phone) {
    // Any phone ending in 0000 deterministically exercises the rate-limit path.
    if (phone.replace(/\D/g, '').endsWith('0000')) {
      throw new AppError('rate_limited', 'account.resendLimited');
    }
  },

  async verifyPhone(_accountId, _phone, code) {
    // Same fixed code as sign-in (MOCK_OTP_CODE), so the wrong-code path is reproducible.
    if (code !== MOCK_OTP_CODE) {
      throw new AppError('validation', 'account.invalidCode', undefined, {
        code: 'account.invalidCode',
      });
    }
  },

  async uploadLicense(_accountId, file) {
    // This reserved filename deterministically exercises an upload rejection.
    if (file.name === 'reject-license.jpg') {
      throw new AppError('validation', 'account.licenseRejected');
    }
    if (!file.name) throw new AppError('validation', 'account.licenseRequired');
  },

  async deleteAccount(accountId) {
    // The seeded sign-in account (u1, +966500000000) has active bookings in the
    // bookings mock, so its deletion is rejected; any newly registered account
    // can be deleted.
    if (accountId === 'u1') {
      throw new AppError('conflict', 'account.deleteRejected');
    }
  },
};
