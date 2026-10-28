import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  signInWithGrant,
  signOut,
  updateSessionProfile,
  requestOtp,
  verifyOtp,
  completeProfile,
  assignLocation,
  logout,
  reportError,
  savePendingRegistration,
  readPendingRegistration,
  clearPendingRegistration,
} = vi.hoisted(() => ({
  signInWithGrant: vi.fn(),
  signOut: vi.fn(),
  updateSessionProfile: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  completeProfile: vi.fn(),
  assignLocation: vi.fn(),
  logout: vi.fn(),
  reportError: vi.fn(),
  savePendingRegistration: vi.fn(),
  readPendingRegistration: vi.fn(),
  clearPendingRegistration: vi.fn(),
}));

vi.mock('@/auth', () => ({ signInWithGrant, signOut, updateSessionProfile }));
vi.mock('./api', () => ({
  authApi: { requestOtp, verifyOtp, completeProfile, assignLocation, logout },
}));
vi.mock('./registration', () => ({
  savePendingRegistration,
  readPendingRegistration,
  clearPendingRegistration,
}));
vi.mock('@/shared/lib/report', () => ({ reportError }));

import { AppError } from '@/shared/lib/errors';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import {
  assignLocationAction,
  completeProfileAction,
  discardRegistrationAction,
  requestOtpAction,
  signOutAction,
  verifyOtpAction,
} from './actions';

const saudi = (phone: string): PhoneFieldValue => ({ countryCode: '+966', phone });

const profile = {
  fullName: ' New Customer ',
  email: 'new@domain.com',
  birthDate: '1990-05-17',
};

beforeEach(() => {
  vi.resetAllMocks();
});

const newUser = { id: '34', name: '', phone: '+966500000001' };
const pendingGrant = { accessToken: 'pending-token', user: newUser, onboardingStep: 'register' };

describe('signOutAction', () => {
  it('revokes the backend token before clearing the session and returns its message', async () => {
    logout.mockResolvedValue('Logged out successfully.');
    signOut.mockResolvedValue(undefined);

    await expect(signOutAction()).resolves.toEqual({
      ok: true, data: undefined, message: 'Logged out successfully.',
    });
    expect(logout.mock.invocationCallOrder[0]).toBeLessThan(signOut.mock.invocationCallOrder[0]);
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
  });

  it('clears the session and reports a backend failure', async () => {
    const error = new AppError('network');
    logout.mockRejectedValue(error);
    signOut.mockResolvedValue(undefined);

    await expect(signOutAction()).resolves.toMatchObject({ ok: false, error: { kind: 'network' } });
    expect(reportError).toHaveBeenCalledWith(error, { scope: 'auth.logout' });
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
  });

  it('reports a failure to clear the local session', async () => {
    const error = new AppError('unknown');
    logout.mockResolvedValue(undefined);
    signOut.mockRejectedValue(error);

    await expect(signOutAction()).resolves.toMatchObject({ ok: false, error: { kind: 'unknown' } });
    expect(reportError).toHaveBeenCalledWith(error, { scope: 'auth.signOut' });
  });
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
  it('rejects an incomplete code without calling the API', async () => {
    const result = await verifyOtpAction(saudi('500000000'), '12');
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { code: 'auth.invalidCode' } },
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('signs an existing customer in with the grant and returns the step', async () => {
    const grant = {
      accessToken: 'token',
      user: { id: '7', name: 'Sara', phone: '+966500000000' },
      onboardingStep: 'completed',
    };
    verifyOtp.mockResolvedValue(grant);

    await expect(verifyOtpAction(saudi('0500000000'), '1234')).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'completed' },
    });
    expect(verifyOtp).toHaveBeenCalledWith({ countryCode: '+966', phone: '500000000' }, '1234');
    expect(signInWithGrant).toHaveBeenCalledWith(grant);
    expect(savePendingRegistration).not.toHaveBeenCalled();
    expect(clearPendingRegistration).toHaveBeenCalled();
  });

  it('keeps a new number pending without a session', async () => {
    verifyOtp.mockResolvedValue(pendingGrant);

    await expect(verifyOtpAction(saudi('500000001'), '1234')).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'register' },
    });
    expect(savePendingRegistration).toHaveBeenCalledWith(pendingGrant);
    expect(signInWithGrant).not.toHaveBeenCalled();
  });

  it('returns a wrong code with the backend message', async () => {
    verifyOtp.mockRejectedValue(
      new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The verification code is invalid or expired.',
      })
    );

    await expect(verifyOtpAction(saudi('500000000'), '9999')).resolves.toMatchObject({
      ok: false,
      error: {
        kind: 'validation',
        status: 422,
        serverMessage: 'The verification code is invalid or expired.',
      },
    });
    expect(signInWithGrant).not.toHaveBeenCalled();
  });

  it('turns an unexpected sign-in failure into unknown', async () => {
    verifyOtp.mockResolvedValue({ ...pendingGrant, onboardingStep: 'completed' });
    signInWithGrant.mockRejectedValue(new Error('boom'));
    await expect(verifyOtpAction(saudi('500000000'), '1234')).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unknown' },
    });
    expect(reportError).toHaveBeenCalled();
  });
});

describe('completeProfileAction', () => {
  const savedUser = {
    id: '34',
    name: 'New Customer',
    phone: '+966500000001',
    email: 'new@domain.com',
  };

  it('rejects a malformed profile without calling the API', async () => {
    const result = await completeProfileAction({ ...profile, email: 'not-an-email' });
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'validation', fieldErrors: { email: 'auth.invalidEmail' } },
    });
    expect(completeProfile).not.toHaveBeenCalled();
  });

  it('is unauthorized without a pending registration', async () => {
    readPendingRegistration.mockResolvedValue(null);
    await expect(completeProfileAction(profile)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
    expect(completeProfile).not.toHaveBeenCalled();
  });

  it('saves the trimmed profile with the pending token, then starts the session', async () => {
    readPendingRegistration.mockResolvedValue(pendingGrant);
    completeProfile.mockResolvedValue({
      user: savedUser,
      onboardingStep: 'location',
      message: 'Profile updated successfully.',
    });

    await expect(completeProfileAction(profile)).resolves.toEqual({
      ok: true,
      data: { onboardingStep: 'location' },
      message: 'Profile updated successfully.',
    });
    expect(completeProfile).toHaveBeenCalledWith(
      { fullName: 'New Customer', email: 'new@domain.com', birthDate: '1990-05-17' },
      'pending-token'
    );
    expect(clearPendingRegistration).toHaveBeenCalled();
    expect(signInWithGrant).toHaveBeenCalledWith({
      accessToken: 'pending-token',
      user: savedUser,
      onboardingStep: 'location',
    });
  });

  it('returns a backend 422 with its message and keeps the registration pending', async () => {
    readPendingRegistration.mockResolvedValue(pendingGrant);
    completeProfile.mockRejectedValue(
      new AppError('validation', undefined, 422, undefined, {
        serverMessage: 'The email has already been taken.',
      })
    );
    await expect(completeProfileAction(profile)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'validation', serverMessage: 'The email has already been taken.' },
    });
    expect(clearPendingRegistration).not.toHaveBeenCalled();
    expect(signInWithGrant).not.toHaveBeenCalled();
  });

  it('returns a revoked token as unauthorized', async () => {
    readPendingRegistration.mockResolvedValue(pendingGrant);
    completeProfile.mockRejectedValue(new AppError('unauthorized', undefined, 401));
    await expect(completeProfileAction(profile)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    });
  });
});

describe('discardRegistrationAction', () => {
  it('clears the pending registration', async () => {
    await discardRegistrationAction();
    expect(clearPendingRegistration).toHaveBeenCalledOnce();
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
