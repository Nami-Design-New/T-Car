'use server';

import { signInWithGrant, signOut, updateSessionProfile } from '@/auth';
import { authApi } from './api';
import { AppError } from '@/shared/lib/errors';
import type { LocationData } from '@/shared/lib/location';
import type { PhoneFieldValue } from '@/shared/lib/phone';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { AuthGrant, OnboardingStep } from './model';
import {
  clearPendingRegistration,
  readPendingRegistration,
  savePendingRegistration,
} from './registration';
import {
  locationSchema,
  phoneSchema,
  registerFormSchema,
  verifyOtpSchema,
  type RegisterFormValues,
} from './validation';

/** Starts the session; a failure here is unexpected (the grant was just issued). */
async function startSession(grant: AuthGrant): Promise<AppError | undefined> {
  try {
    await signInWithGrant(grant);
    return undefined;
  } catch (error) {
    reportError(error, { scope: 'auth.signIn' });
    return new AppError('unknown', undefined, undefined, undefined, { cause: error });
  }
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
 * Verifies the code. An existing customer is signed in. A new number (its
 * account is created here) gets no session yet: the token waits in the
 * pending-registration cookie until the profile is saved. Resolves with what
 * is left of onboarding; a wrong code keeps the backend's message.
 */
export async function verifyOtpAction(
  phone: PhoneFieldValue,
  code: string
): Promise<ActionResult<{ onboardingStep: OnboardingStep }>> {
  const parsed = verifyOtpSchema.safeParse({ phone, code });
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  let grant: AuthGrant;
  try {
    grant = await authApi.verifyOtp(parsed.data.phone, parsed.data.code);
  } catch (error) {
    // reportError skips expected outcomes (validation, e.g. a wrong code).
    reportError(error, { scope: 'auth.verifyOtp' });
    return toActionResult(fail(error));
  }
  const { onboardingStep } = grant;
  if (onboardingStep === 'register') {
    await savePendingRegistration(grant);
    return toActionResult(ok({ onboardingStep }));
  }
  await clearPendingRegistration();
  const error = await startSession(grant);
  return toActionResult(error ? fail(error) : ok({ onboardingStep }));
}

/**
 * Saves the new customer's profile with the token from verification, then
 * starts the session. Resolves with the new step and the backend's message,
 * which the client toasts. Without a pending registration (expired, or
 * discarded) it is `unauthorized`: the customer verifies again.
 */
export async function completeProfileAction(
  input: RegisterFormValues
): Promise<ActionResult<{ onboardingStep: OnboardingStep }>> {
  const parsed = registerFormSchema.safeParse(input);
  if (!parsed.success) return toActionResult(fail(toValidationError(parsed.error)));
  const pending = await readPendingRegistration();
  if (!pending) return toActionResult(fail(new AppError('unauthorized')));
  try {
    const { user, onboardingStep, message } = await authApi.completeProfile(
      parsed.data,
      pending.accessToken
    );
    await clearPendingRegistration();
    const error = await startSession({ accessToken: pending.accessToken, user, onboardingStep });
    return toActionResult(error ? fail(error) : ok({ onboardingStep }, message));
  } catch (error) {
    reportError(error, { scope: 'auth.completeProfile' });
    return toActionResult(fail(error));
  }
}

/** Drops a registration the customer left (closed the profile form or went back). */
export async function discardRegistrationAction(): Promise<void> {
  await clearPendingRegistration();
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
