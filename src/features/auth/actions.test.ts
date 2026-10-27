import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  signIn,
  readSignedInStep,
  updateSessionProfile,
  requestOtp,
  completeProfile,
  assignLocation,
  OtpSignInError,
} = vi.hoisted(() => {
  class OtpSignInError extends Error {
    constructor(readonly error: unknown) {
      super('otp');
    }
  }
  return {
    signIn: vi.fn(),
    readSignedInStep: vi.fn(),
    updateSessionProfile: vi.fn(),
    requestOtp: vi.fn(),
    completeProfile: vi.fn(),
    assignLocation: vi.fn(),
    OtpSignInError,
  };
});

vi.mock('@/auth', () => ({
  signIn,
  signOut: vi.fn(),
  readSignedInStep,
  updateSessionProfile,
  OtpSignInError,
}));
vi.mock('./api', () => ({ authApi: { requestOtp, completeProfile, assignLocation } }));
vi.mock('@/shared/lib/report', () => ({ reportError: vi.fn() }));

import { AppError } from '@/shared/lib/errors';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import {
  assignLocationAction,
  completeProfileAction,
  requestOtpAction,
  verifyOtpAction,
} from './actions';

const saudi = (phone: string): PhoneFieldValue => ({ countryCode: '+966', phone });

const profile = {
  fullName: ' New Customer ',
  email: 'new@domain.com',
  birthDate: '1990-05-17',
};

beforeEach(() => {
  signIn.mockReset();
  readSignedInStep.mockReset();
  updateSessionProfile.mockReset();
  requestOtp.mockReset();
  completeProfile.mockReset();
  assignLocation.mockReset();
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
    const result = await verifyOtpAction(saudi('500000000'), '12');
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { code: 'auth.invalidCode' } },
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with the normalized phone and returns the onboarding step', async () => {
    signIn.mockResolvedValue(undefined);
    readSignedInStep.mockResolvedValue('register');

    await expect(verifyOtpAction(saudi('0500000001'), '1234')).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'register' },
    });
    expect(signIn).toHaveBeenCalledWith('otp', {
      countryCode: '+966',
      phone: '500000001',
      code: '1234',
      redirect: false,
    });
  });

  it('does not block a signed-in user when the step cannot be read back', async () => {
    signIn.mockResolvedValue(undefined);
    readSignedInStep.mockResolvedValue(undefined);

    await expect(verifyOtpAction(saudi('500000000'), '1234')).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'completed' },
    });
  });

  it('returns the provider error as it is, with the backend message', async () => {
    const error = new AppError('validation', undefined, 422, undefined, {
      serverMessage: 'The verification code is invalid or expired.',
    });
    signIn.mockRejectedValue(new OtpSignInError(error));

    await expect(verifyOtpAction(saudi('500000000'), '9999')).resolves.toMatchObject({
      ok: false,
      error: {
        kind: 'validation',
        status: 422,
        serverMessage: 'The verification code is invalid or expired.',
      },
    });
  });

  it('turns an unexpected sign-in failure into unknown', async () => {
    signIn.mockRejectedValue(new Error('boom'));
    await expect(verifyOtpAction(saudi('500000000'), '1234')).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unknown' },
    });
  });
});

describe('completeProfileAction', () => {
  it('rejects a malformed profile without calling the API', async () => {
    const result = await completeProfileAction({ ...profile, email: 'not-an-email' });
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { email: 'auth.invalidEmail' } },
    });
    expect(completeProfile).not.toHaveBeenCalled();
  });

  it('saves the trimmed profile, updates the session, and returns the step and message', async () => {
    completeProfile.mockResolvedValue({
      user: { id: '34', name: 'New Customer', phone: '+966500000001', email: 'new@domain.com' },
      onboardingStep: 'location',
      message: 'Profile updated successfully.',
    });

    await expect(completeProfileAction(profile)).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'location' },
      message: 'Profile updated successfully.',
    });
    expect(completeProfile).toHaveBeenCalledWith({
      fullName: 'New Customer',
      email: 'new@domain.com',
      birthDate: '1990-05-17',
    });
    expect(updateSessionProfile).toHaveBeenCalledWith({
      name: 'New Customer',
      email: 'new@domain.com',
      onboardingStep: 'location',
    });
  });

  it('returns a backend 422 with its message and leaves the session alone', async () => {
    completeProfile.mockRejectedValue(
      new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The email has already been taken.',
      })
    );
    await expect(completeProfileAction(profile)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'validation', serverMessage: 'The email has already been taken.' },
    });
    expect(updateSessionProfile).not.toHaveBeenCalled();
  });

  it('returns a revoked token as unauthorized', async () => {
    completeProfile.mockRejectedValue(new AppError('unauthorized', undefined, 401));
    await expect(completeProfileAction(profile)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });
});

describe('assignLocationAction', () => {
  const picked = { lat: 24.7136, lng: 46.6753, address: ' King Fahd Rd, Riyadh ', region: 'Riyadh Province' };

  it('rejects a location without an address without calling the API', async () => {
    const result = await assignLocationAction({ ...picked, address: '  ' });
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { address: 'auth.invalidLocation' } },
    });
    expect(assignLocation).not.toHaveBeenCalled();
  });

  it('saves the location, moves the session on, and returns the message', async () => {
    assignLocation.mockResolvedValue({
      user: { id: '34', name: 'Test', phone: '+966593080235' },
      onboardingStep: 'completed',
      message: 'Location saved successfully.',
    });

    await expect(assignLocationAction(picked)).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'completed' },
      message: 'Location saved successfully.',
    });
    expect(assignLocation).toHaveBeenCalledWith({
      latitude: 24.7136,
      longitude: 46.6753,
      addressName: 'King Fahd Rd, Riyadh',
      region: 'Riyadh Province',
    });
    expect(updateSessionProfile).toHaveBeenCalledWith({ onboardingStep: 'completed' });
  });

  it('sends the address as the region when the geocoder has none', async () => {
    assignLocation.mockResolvedValue({
      user: { id: '34', name: 'Test', phone: '+966593080235' },
      onboardingStep: 'completed',
      message: 'Location saved successfully.',
    });
    await assignLocationAction({ ...picked, region: undefined });
    expect(assignLocation).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'King Fahd Rd, Riyadh' })
    );
  });
});
