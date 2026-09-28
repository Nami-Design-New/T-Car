import { AppError, toAppError } from './errors';

/** Writes return a Result instead of throwing, so callers must handle both branches. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = (error: unknown): Result<never> => ({ ok: false, error: toAppError(error) });
