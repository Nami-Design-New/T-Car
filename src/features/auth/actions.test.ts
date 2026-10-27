import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signIn, sendOtp, CredentialsSignin } = vi.hoisted(() => {
  class CredentialsSignin extends Error {
    code = 'credentials';
  }
  return { signIn: vi.fn(), sendOtp: vi.fn(), CredentialsSignin };
});

vi.mock('next-auth', () => ({ CredentialsSignin }));
vi.mock('@/auth', () => ({ signIn, signOut: vi.fn() }));
vi.mock('./api', () => ({ authApi: { sendOtp } }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));

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
  sendOtp.mockReset();
});

describe('requestOtpAction', () => {
  it('rejects a malformed phone without calling the service', async () => {
    await expect(requestOtpAction('+966')).resolves.toEqual({
      ok: false,
      error: {
        kind: 'validation',
        code: 'auth.invalidPhone',
        fieldErrors: { phone: 'auth.invalidPhone' },
      },
    });
    expect(sendOtp).not.toHaveBeenCalled();
  });

  it('rejects input that is not a string', async () => {
    const result = await requestOtpAction({ phone: '966500000000' } as unknown as string);
    expect(result.ok).toBe(false);
    expect(sendOtp).not.toHaveBeenCalled();
  });

  it('sends the trimmed phone', async () => {
    sendOtp.mockResolvedValue(undefined);
    await expect(requestOtpAction(' 966500000000 ')).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(sendOtp).toHaveBeenCalledWith('966500000000');
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
