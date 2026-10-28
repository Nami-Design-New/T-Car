import {
  AUTH_ERROR_CODES,
  isNationalNumber,
  isOldEnough,
  type AuthGrant,
  type AuthUser,
  type OnboardingStep,
} from './model';
import { AppError } from '@/shared/lib/errors';
import type { AuthApi } from './api';

/** Mock only: the one code every phone accepts. */
export const MOCK_OTP_CODE = '1234';

/** Mock only: phones that already have an account. Any other phone is a new account (`register`). */
const MOCK_USERS: AuthUser[] = [
  { id: 'u1', name: 'أحمد عبدالله القحطاني', phone: '+966500000000', email: 'ahmed@domain.com' },
];

/** Mock only: the profile write fails with the backend's 422 for this email. */
export const MOCK_REJECTED_EMAIL = 'taken@domain.com';

const digits = (phone: string) => phone.replace(/\D/g, '');

const grantFor = (user: AuthUser, onboardingStep: OnboardingStep): AuthGrant => ({
  // Not a real credential: the mock backend accepts anything.
  accessToken: `mock-token-${user.id}`,
  user,
  onboardingStep,
});

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

/** The backend's validation error: HTTP 200 with `code: 422` and one message. */
const backend422 = (serverMessage: string) =>
  new AppError('validation', undefined, 422, undefined, { serverMessage });

// Test-only (the app calls the API). Stateless, because module state on the
// server would be shared between every user. Like the backend, verifying an
// unknown number creates the account with `register` left.
export const authMock: AuthApi = {
  async requestOtp({ phone }) {
    await delay();
    if (!isNationalNumber(phone)) {
      throw new AppError('validation', 'auth.invalidPhone', undefined, { phone: 'auth.invalidPhone' });
    }
    return 'OTP has been sent successfully.';
  },

  async verifyOtp({ countryCode, phone }, code) {
    await delay();
    const number = `${countryCode}${phone}`;
    if (code !== MOCK_OTP_CODE) {
      throw new AppError('validation', AUTH_ERROR_CODES.invalidCode, undefined, {
        code: AUTH_ERROR_CODES.invalidCode,
      });
    }
    const user = MOCK_USERS.find((item) => digits(item.phone) === digits(number));
    if (user) return grantFor(user, 'completed');
    return grantFor({ id: `u-${digits(number)}`, name: '', phone: number }, 'register');
  },

  async completeProfile({ fullName, email, birthDate }) {
    await delay();
    if (email === MOCK_REJECTED_EMAIL) throw backend422('The email has already been taken.');
    if (!isOldEnough(birthDate)) throw backend422('You must be at least 18 years old.');
    return {
      user: { id: 'u-new', name: fullName, phone: '+966500000001', email },
      onboardingStep: 'location',
      message: 'Profile updated successfully.',
    };
  },

  async assignLocation({ latitude, addressName }) {
    await delay();
    if (Math.abs(latitude) > 90) throw backend422('The latitude must be between -90 and 90.');
    if (!addressName.trim()) throw backend422('The address name field is required.');
    return {
      user: { id: 'u-new', name: 'New Customer', phone: '+966500000001' },
      onboardingStep: 'completed',
      message: 'Location saved successfully.',
    };
  },

  async logout() {
    await delay();
    return 'Logged out successfully.';
  },
};
