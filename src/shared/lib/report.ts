import { toAppError } from './errors';

export function reportError(error: unknown, context?: Record<string, unknown>) {
  const err = toAppError(error);
  if (err.kind === 'validation' || err.kind === 'unauthorized') return; // expected, not bugs
  // later: Sentry.captureException(err, { extra: context })
  if (process.env.NODE_ENV !== 'production') console.error(err, context);
}
