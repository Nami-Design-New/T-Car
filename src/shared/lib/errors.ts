export type AppErrorKind =
  | 'network' // offline, DNS, CORS
  | 'timeout'
  | 'unauthorized' // 401: session missing or expired
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'validation' // 400/422 with field errors
  | 'conflict' // 409: e.g. car no longer available, insufficient balance
  | 'rate_limited' // 429: e.g. OTP resend
  | 'server' // 5xx
  | 'unknown';

/** The one error type that crosses every layer. Only `services/http` creates it from raw failures. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    /** i18n key under `errors.*`, e.g. 'wallet.topUpRejected'. Falls back to `errors.<kind>`. */
    readonly code?: string,
    readonly status?: number,
    /** field → i18n key under `errors.*` */
    readonly fieldErrors?: Record<string, string>,
    options?: { cause?: unknown }
  ) {
    super(code ?? kind, options);
    this.name = 'AppError';
  }
}

export function kindFromStatus(status: number): AppErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (typeof Response !== 'undefined' && error instanceof Response) {
    return new AppError(kindFromStatus(error.status), undefined, error.status, undefined, {
      cause: error,
    });
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new AppError('timeout', undefined, undefined, undefined, { cause: error });
  }

  // fetch rejects with a TypeError when the request never reaches the server.
  if (error instanceof TypeError) {
    return new AppError('network', undefined, undefined, undefined, { cause: error });
  }

  return new AppError('unknown', undefined, undefined, undefined, { cause: error });
}

/** i18n keys to try under `errors.*`, most specific first. */
export function errorMessageKeys(error: AppError): string[] {
  return [error.code, error.kind, 'unknown'].filter((key): key is string => Boolean(key));
}
