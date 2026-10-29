import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodError } from 'zod';
import { AppError } from '../errors';

// Domain-free rules shared by feature schemas (doc 9 §9.1: promoted once a
// second feature needed them). Each feature keeps its own `errors.*` keys.

/**
 * Digits a phone number may have, country code included: 8 is the approved interim
 * minimum, 15 is the maximum for now. Supported countries and the stored format
 * are not decided yet (doc 9 §9.4), so the number is checked, not rewritten.
 */
const PHONE_DIGITS = { min: 8, max: 15 };

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;

export const MIN_AGE = 18;

/** Whether someone born on a valid YYYY-MM-DD date is at least 18 today (UTC). */
export function isOldEnough(birthDate: string, now: Date = new Date()): boolean {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return false;
  return Date.UTC(year + MIN_AGE, month - 1, day) <= now.getTime();
}

/** Unicode letters and spaces are allowed; punctuation and digits are not. */
export function isFullName(value: string) {
  return /^[\p{L}\p{M}]+(?:[ \u00a0]+[\p{L}\p{M}]+)*$/u.test(value);
}

export function isPhoneNumber(value: string) {
  if (!/^\+?[\d\s()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= PHONE_DIGITS.min && digits <= PHONE_DIGITS.max;
}

/** A real `YYYY-MM-DD` calendar date that is not in the future. */
export function isPastIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  // Rejects dates such as 2001-02-30, which Date rolls over into March.
  return date.toISOString().startsWith(value) && date.getTime() <= Date.now();
}

/**
 * A failed schema parse as a `validation` AppError (doc 9 §9.2). Field errors
 * keep the first issue per field; the code is the first of them, so a form
 * that cannot show a field still gets a specific message.
 */
export function toValidationError(error: ZodError): AppError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message;
  }
  const code = Object.values(fieldErrors)[0] ?? error.issues[0]?.message;
  return new AppError('validation', code, undefined, fieldErrors);
}

/**
 * Maps a Server Action's field errors onto the form's own fields with
 * `setError`, focusing the first. Returns false when none of them belongs to
 * the form, so the caller shows the error as a form-level message instead.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
): boolean {
  let applied = false;
  for (const [field, key] of Object.entries(error.fieldErrors ?? {})) {
    if (!fields.includes(field as Path<T>)) continue;
    setError(field as Path<T>, { type: 'server', message: key }, { shouldFocus: !applied });
    applied = true;
  }
  return applied;
}
