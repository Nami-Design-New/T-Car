'use server';

import { CredentialsSignin } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { authApi } from './api';
import { AppError, type AppErrorKind } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import { AUTH_ERROR_CODES } from './model';
import {
  phoneSchema,
  registrationSchema,
  verifyOtpSchema,
  type RegistrationSubmission,
} from './validation';

/** Validation codes the provider passes through, and the form field each belongs to. */
const VALIDATION_FIELDS = new Map<string, string>([
  [AUTH_ERROR_CODES.invalidCode, 'code'],
  ['auth.invalidPhone', 'phone'],
  ['auth.nameRequired', 'fullName'],
]);

/** The provider only passes a code string through; rebuild the AppError from it. */
function signInError(error: unknown): AppError {
  if (error instanceof CredentialsSignin) {
    const code = error.code;
    const field = VALIDATION_FIELDS.get(code);
    if (field) return new AppError('validation', code, undefined, { [field]: code });
    if (code === AUTH_ERROR_CODES.registrationRequired) return new AppError('conflict', code);
    // Transport failures come through as their kind (network, server, ...).
    return new AppError(code as AppErrorKind);
  }
  reportError(error, { scope: 'auth.signIn' });
  return new AppError('unknown', undefined, undefined, undefined, { cause: error });
}

// Each action parses its input again: the client's validation is not trusted.

export async function requestOtpAction(phone: string): Promise<ActionResult<void>> {
  const parsed = phoneSchema.safeParse({ phone });
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    await authApi.sendOtp(parsed.data.phone);
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
  const parsed = verifyOtpSchema.safeParse({ phone, code });
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    await signIn('otp', { ...parsed.data, redirect: false });
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
export async function registerAction(
  input: RegistrationSubmission
): Promise<ActionResult<void>> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  // The terms checkbox is checked here only; the backend contract has no field for it yet.
  const { phone, code, fullName, email, birthDate } = parsed.data;
  try {
    await signIn('otp', {
      phone,
      code,
      fullName,
      email,
      birthDate,
      intent: 'register',
      redirect: false,
    });
    return toActionResult(ok(undefined));
  } catch (error) {
    return toActionResult(fail(signInError(error)));
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
