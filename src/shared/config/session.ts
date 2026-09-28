/**
 * NextAuth session cookie. A fixed name, so the server http client can read the
 * session with getToken() without guessing the `__Secure-` prefix. Secure
 * (https only) in production.
 */
export const SECURE_SESSION_COOKIE = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE = `${SECURE_SESSION_COOKIE ? '__Secure-' : ''}tcar.session-token`;
