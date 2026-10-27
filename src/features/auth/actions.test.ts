import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signIn, requestOtp, CredentialsSignin } = vi.hoisted(() => {
  class CredentialsSignin extends Error {
    code = 'credentials';
  }
  return { signIn: vi.fn(), requestOtp: vi.fn(), CredentialsSignin };
});

vi.mock('next-auth', () => ({ CredentialsSignin }));
vi.mock('@/auth', () => ({ signIn, signOut: vi.fn() }));
vi.mock('./api', () => ({ authApi: { requestOtp } }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));

import { AppError } from '@/shared/lib/errors';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { registerAction, requestOtpAction, verifyOtpAction } from './actions';

/** What the sign-in provider throws for an AppError code. */
function providerError(code: string) {
  const error = new CredentialsSignin();
  error.code = code;
  return error;
}

const registration = {
  phone: '966500000001',
  code: '1234',
  fullName: ' New Customer ',
  email: 'new@domain.com',
  birthDate: '1990-05-17',
  acceptTerms: true,
};

beforeEach(() => {
  signIn.mockReset();
  requestOtp.mockReset();
});

describe('requestOtpAction', () => {
  it('rejects a malformed phone without calling the service', async () => {
    await expect(requestOtpAction({ countryCode: '+966', phone: '12' })).resolves.toEqual({
      ok: false,
      error: {
        kind: 'validation',
        code: 'auth.invalidPhone',
        fieldErrors: { phone: 'auth.invalidPhone' },
      },
    });
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it.each([
    ['not an object', '966500000000'],
    ['a bad calling code', { countryCode: '966', phone: '500000000' }],
    ['letters in the number', { countryCode: '+966', phone: '5000abc00' }],
  ])('rejects %s', async (_case, input) => {
    const result = await requestOtpAction(input as unknown as PhoneFieldValue);
    expect(result).toMatchObject({ ok: false, error: { fieldErrors: { phone: 'auth.invalidPhone' } } });
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it('sends the normalized national number and returns it with the backend message', async () => {
    requestOtp.mockResolvedValue('OTP has been sent successfully.');
    await expect(requestOtpAction({ countryCode: ' +966 ', phone: ' 0544 444 442 ' })).resolves.toEqual({
      ok: true,
      data: { countryCode: '+966', phone: '544444442' },
      message: 'OTP has been sent successfully.',
    });
    expect(requestOtp).toHaveBeenCalledWith({ countryCode: '+966', phone: '544444442' });
  });

  it('returns a backend validation error with its message', async () => {
    requestOtp.mockRejectedValue(
      new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The phone number must be 8 to 15 digits only.',
      })
    );
    await expect(requestOtpAction({ countryCode: '+966', phone: '544444442' })).resolves.toMatchObject({
      ok: false,
      error: { kind: 'validation', status: 422, serverMessage: 'The phone number must be 8 to 15 digits only.' },
    });
  });
});

describe('verifyOtpAction', () => {
  it('rejects an incomplete code without signing in', async () => {
    const result = await verifyOtpAction('966500000000', '12');
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { code: 'auth.invalidCode' } },
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('returns a wrong code from the provider as a field error', async () => {
    signIn.mockRejectedValue(providerError('auth.invalidCode'));
    const result = await verifyOtpAction('966500000000', '9999');
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'validation',
        code: 'auth.invalidCode',
        fieldErrors: { code: 'auth.invalidCode' },
      },
    });
  });

  it('reports a phone without an account as a registration step, not an error', async () => {
    signIn.mockRejectedValue(providerError('auth.registrationRequired'));
    await expect(verifyOtpAction('966500000001', '1234')).resolves.toEqual({
      ok: true,
      data: { registrationRequired: true },
    });
  });
});

describe('registerAction', () => {
  it('rejects a malformed profile without signing in', async () => {
    const result = await registerAction({
      ...registration,
      email: 'not-an-email',
      acceptTerms: false,
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: 'validation',
        fieldErrors: { email: 'auth.invalidEmail', acceptTerms: 'auth.termsRequired' },
      },
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with the parsed profile and leaves the terms flag out', async () => {
    signIn.mockResolvedValue(undefined);
    await expect(registerAction(registration)).resolves.toEqual({ ok: true, data: undefined });
    expect(signIn).toHaveBeenCalledWith('otp', {
      phone: '966500000001',
      code: '1234',
      fullName: 'New Customer',
      email: 'new@domain.com',
      birthDate: '1990-05-17',
      intent: 'register',
      redirect: false,
    });
  });

  it('keeps transport failures as their kind', async () => {
    signIn.mockRejectedValue(providerError('network'));
    await expect(registerAction(registration)).resolves.toEqual({
      ok: false,
      error: { kind: 'network' },
    });
  });
});
