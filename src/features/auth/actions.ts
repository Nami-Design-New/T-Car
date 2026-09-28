'use server';

import { CredentialsSignin } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { authApi } from '@/services/auth.api';
import { AppError, type AppErrorKind } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { AUTH_ERROR_CODES, type RegistrationInput } from './model';

const VALIDATION_CODES = new Set<string>([
  AUTH_ERROR_CODES.invalidCode,
  'auth.invalidPhone',
  'auth.nameRequired',
]);

/** The provider only passes a code string through; rebuild the AppError from it. */
function signInError(error: unknown): AppError {
  if (error instanceof CredentialsSignin) {
    const code = error.code;
    if (VALIDATION_CODES.has(code)) return new AppError('validation', code);
    if (code === AUTH_ERROR_CODES.registrationRequired) return new AppError('conflict', code);
    // Transport failures come through as their kind (network, server, ...).
    return new AppError(code as AppErrorKind);
  }
  reportError(error, { scope: 'auth.signIn' });
  return new AppError('unknown', undefined, undefined, undefined, { cause: error });
}

export async function requestOtpAction(phone: string): Promise<ActionResult<void>> {
  try {
    await authApi.sendOtp(phone);
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: 'auth.requestOtp' });
    return toActionResult(fail(error));
  }
}

/** Signs in an existing customer, or reports that the phone needs an account first. */
export async function verifyOtpAction(
  phone: string,
  code: string
): Promise<ActionResult<{ registrationRequired: boolean }>> {
  try {
    await signIn('otp', { phone, code, redirect: false });
    return toActionResult(ok({ registrationRequired: false }));
  } catch (error) {
    const appError = signInError(error);
    if (appError.code === AUTH_ERROR_CODES.registrationRequired) {
      return toActionResult(ok({ registrationRequired: true }));
    }
    return toActionResult(fail(appError));
  }
}

/** Creates the account for a verified phone and signs it in. */
export async function registerAction(input: RegistrationInput): Promise<ActionResult<void>> {
  try {
    await signIn('otp', { ...input, intent: 'register', redirect: false });
    return toActionResult(ok(undefined));
  } catch (error) {
    return toActionResult(fail(signInError(error)));
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
