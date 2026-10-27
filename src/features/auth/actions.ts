'use server';

import {
  OtpSignInError,
  readSignedInStep,
  signIn,
  signOut,
  updateSessionProfile,
} from '@/auth';
import { authApi } from './api';
import { AppError } from '@/shared/lib/errors';
import type { LocationData } from '@/shared/lib/location';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { OnboardingStep } from './model';
import {
  locationSchema,
  phoneSchema,
  registerFormSchema,
  verifyOtpSchema,
  type RegisterFormValues,
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
 * Saves the new customer's profile with the session's token (issued at
 * verification), then updates the session's name, email, and onboarding step.
 * Resolves with the new step and the backend's message, which the client toasts.
 */
export async function completeProfileAction(
  input: RegisterFormValues
): Promise<ActionResult<{ onboardingStep: OnboardingStep }>> {
  const parsed = registerFormSchema.safeParse(input);
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    const { user, onboardingStep, message } = await authApi.completeProfile(parsed.data);
    await updateSessionProfile({ name: user.name, email: user.email, onboardingStep });
    return toActionResult(ok({ onboardingStep }, message));
  } catch (error) {
    reportError(error, { scope: 'auth.completeProfile' });
    return toActionResult(fail(error));
  }
}

/**
 * Saves the location picked on the map (the last onboarding step) with the
 * session's token, then moves the session's step on. Resolves with the new
 * step and the backend's message, which the client toasts.
 */
export async function assignLocationAction(
  location: LocationData
): Promise<ActionResult<{ onboardingStep: OnboardingStep }>> {
  const parsed = locationSchema.safeParse(location);
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  try {
    const { onboardingStep, message } = await authApi.assignLocation(parsed.data);
    await updateSessionProfile({ onboardingStep });
    return toActionResult(ok({ onboardingStep }, message));
  } catch (error) {
    reportError(error, { scope: 'auth.assignLocation' });
    return toActionResult(fail(error));
  }
}

/** Revoke the backend token before clearing the cookie that supplies it. */
export async function signOutAction(): Promise<ActionResult<void>> {
  let result: ActionResult<void>;
  try {
    result = toActionResult(ok(undefined, await authApi.logout()));
  } catch (error) {
    reportError(error, { scope: 'auth.logout' });
    result = toActionResult(fail(error));
  }

  try {
    await signOut({ redirect: false });
  } catch (error) {
    reportError(error, { scope: 'auth.signOut' });
    return toActionResult(fail(error));
  }
  return result;
}
