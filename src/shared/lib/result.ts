import { AppError, toAppError, type AppErrorKind } from './errors';

/**
 * Writes return a Result instead of throwing, so callers must handle both
 * branches. `message` is the backend's success message, shown as a toast.
 */
export type Result<T> = { ok: true; data: T; message?: string } | { ok: false; error: AppError };

export const ok = <T>(data: T, message?: string): Result<T> =>
  message === undefined ? { ok: true, data } : { ok: true, data, message };

export const fail = (error: unknown): Result<never> => ({ ok: false, error: toAppError(error) });

/** An AppError as plain data, so it can cross the Server Action boundary. */
export interface AppErrorData {
  kind: AppErrorKind;
  code?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
  serverMessage?: string;
}

/**
 * What a Server Action returns. Class instances such as AppError do not
 * survive serialization to the client, so the error travels as plain data.
 */
export type ActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: AppErrorData };

/** In a Server Action: turns a Result into something the client can receive. */
export function toActionResult<T>(result: Result<T>): ActionResult<T> {
  if (result.ok) return result;
  const { kind, code, status, fieldErrors, serverMessage } = result.error;
  return { ok: false, error: { kind, code, status, fieldErrors, serverMessage } };
}

/** On the client: turns a Server Action's result back into a Result with a real AppError. */
export function fromActionResult<T>(result: ActionResult<T>): Result<T> {
  if (result.ok) return result;
  const { kind, code, status, fieldErrors, serverMessage } = result.error;
  return { ok: false, error: new AppError(kind, code, status, fieldErrors, { serverMessage }) };
}
