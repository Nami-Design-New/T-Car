/**
 * NextAuth session cookie. A fixed name, so the server http client can read the
 * session with getToken() without guessing the `__Secure-` prefix. Secure
 * (https only) in production.
 */
export const SECURE_SESSION_COOKIE = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE = `${SECURE_SESSION_COOKIE ? '__Secure-' : ''}tcar.session-token`;

/** Set and cleared with the same attributes, or a browser keeps the `__Secure-` cookie. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: SECURE_SESSION_COOKIE,
} as const;

/**
 * `?auth=expired&proof=…`: the backend rejected the session's token (revoked on
 * logout or account deletion; tokens do not expire). With a valid proof
 * (shared/lib/session-proof.ts) the middleware clears the session cookie and
 * opens the sign-in dialog (`?auth=login`).
 */
export const SESSION_EXPIRED = 'expired';

export const SESSION_PROOF_PARAM = 'proof';

/** Request header the middleware sets to the locale-less path and query, the `next` after sign-in. */
export const NEXT_PATH_HEADER = 'x-tcar-next';
