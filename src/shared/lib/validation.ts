import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodError } from 'zod';
import { AppError } from './errors';

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
