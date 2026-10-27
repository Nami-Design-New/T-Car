'use server';

import { OtpSignInError, readSignedInStep, signIn, signOut } from '@/auth';
import { authApi } from './api';
import { AppError } from '@/shared/lib/errors';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { OnboardingStep } from './model';
import {
  phoneSchema,
  registrationSchema,
  verifyOtpSchema,
  type RegistrationSubmission,
} from './validation';

/** The provider rethrows its own error with the AppError inside (see src/auth.ts). */
function signInError(error: unknown): AppError {
  if (error instanceof OtpSignInError) return error.error;
  reportError(error, { scope: 'auth.signIn' });
  return new AppError('unknown', undefined, undefined, undefined, { cause: error });
}

// Each action parses its input again: the client's validation is not trusted.

/**
 * Sends the login code. Resolves with the normalized phone (the one to verify)
 * and the backend's message, which the client toasts.
 */
export async function requestOtpAction(
  phone: PhoneFieldValue
): Promise<ActionResult<PhoneFieldValue>> {
  const parsed = phoneSchema.safeParse({ phone });
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    const message = await authApi.requestOtp(parsed.data.phone);
    return toActionResult(ok(parsed.data.phone, message));
  } catch (error) {
    reportError(error, { scope: 'auth.requestOtp' });
    return toActionResult(fail(error));
  }
}

/**
 * Verifies the code and signs the customer in; a new number gets its account
 * here. Resolves with what is left of onboarding, so the dialog knows whether
 * to show the registration form. A wrong code keeps the backend's message.
 */
export async function verifyOtpAction(
  phone: PhoneFieldValue,
  code: string
): Promise<ActionResult<{ onboardingStep: OnboardingStep }>> {
  const parsed = verifyOtpSchema.safeParse({ phone, code });
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    await signIn('otp', { ...parsed.data.phone, code: parsed.data.code, redirect: false });
  } catch (error) {
    return toActionResult(fail(signInError(error)));
  }
  const onboardingStep = await readSignedInStep();
  if (!onboardingStep) {
    // Signed in, but the new session could not be read back: do not block the user.
    reportError(new AppError('unknown'), { scope: 'auth.verifyOtp.step' });
  }
  return toActionResult(ok({ onboardingStep: onboardingStep ?? 'completed' }));
}

/**
 * Creates the account for a verified phone and signs it in. Still the mock
 * (it re-checks phone and code) until A6 calls `/complete-profile`.
 */
export async function registerAction(
  input: RegistrationSubmission
): Promise<ActionResult<void>> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  const { phone, code, fullName, email, birthDate } = parsed.data;
  try {
    await signIn('otp', {
      ...phone,
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
