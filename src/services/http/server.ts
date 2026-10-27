import 'server-only';
import { getLocale } from 'next-intl/server';
import { env } from '@/shared/config/env';
import { createHttpClient } from './client';
import { clearSession, readAccessToken } from './session';

/** The request's locale; undefined outside a localized request (e.g. a route handler). */
async function readLocale(): Promise<string | undefined> {
  try {
    return await getLocale();
  } catch {
    return undefined;
  }
}

/**
 * Server client for public endpoints (OTP request and verify): no bearer token,
 * so a stale session never reaches calls that must not depend on one.
 */
export const publicServerHttp = createHttpClient({
  baseUrl: env.serverApiUrl,
  getLocale: readLocale,
});

/**
 * Server client: forwards the signed-in customer's backend token as the bearer
 * token. A 401 means the token is dead (revoked; tokens do not expire), so a
 * Server Action clears the session before returning `unauthorized`.
 */
export const serverHttp = createHttpClient({
  baseUrl: env.serverApiUrl,
  getToken: readAccessToken,
  getLocale: readLocale,
  onUnauthorized: clearSession,
});
