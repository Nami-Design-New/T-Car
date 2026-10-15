import { AUTH_ERROR_CODES, type AuthGrant, type AuthUser } from '@/features/auth/model';
import { AppError } from '@/shared/lib/errors';
import type { AuthApi } from '../auth.api';

/** Mock only: the one code every phone accepts. */
export const MOCK_OTP_CODE = '1234';

/** Mock only: phones that already have an account. Any other phone goes to registration. */
const MOCK_USERS: AuthUser[] = [
  { id: 'u1', name: 'أحمد عبدالله القحطاني', phone: '+966500000000', email: 'ahmed@domain.com' },
];

const digits = (phone: string) => phone.replace(/\D/g, '');

const grantFor = (user: AuthUser): AuthGrant => ({
  // Not a real credential: the mock backend accepts anything.
  accessToken: `mock-token-${user.id}`,
  user,
});

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

function checkCode(phone: string, code: string) {
  if (digits(phone).length < 9) {
    throw new AppError('validation', 'auth.invalidPhone', undefined, { phone: 'auth.invalidPhone' });
  }
  if (code !== MOCK_OTP_CODE) {
    throw new AppError('validation', AUTH_ERROR_CODES.invalidCode, undefined, {
      code: AUTH_ERROR_CODES.invalidCode,
    });
  }
}

// Stateless (a registration is not remembered), because this runs on the
// server where module state would be shared between every user.
export const authMock: AuthApi = {
  async sendOtp(phone) {
    await delay();
    if (digits(phone).length < 9) {
      throw new AppError('validation', 'auth.invalidPhone', undefined, { phone: 'auth.invalidPhone' });
    }
  },

  async verifyOtp(phone, code) {
    await delay();
    checkCode(phone, code);
    const user = MOCK_USERS.find((item) => digits(item.phone) === digits(phone));
    if (!user) throw new AppError('conflict', AUTH_ERROR_CODES.registrationRequired);
    return grantFor(user);
  },

  async register({ phone, code, fullName, email }) {
    await delay();
    checkCode(phone, code);
    if (!fullName.trim()) {
      throw new AppError('validation', 'auth.nameRequired', undefined, { fullName: 'auth.nameRequired' });
    }
    return grantFor({ id: `u-${digits(phone)}`, name: fullName.trim(), phone, email: email || undefined });
  },
};
