import 'server-only';
import { headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { SESSION_COOKIE } from '@/shared/config/session';
import { env } from '@/shared/config/env';
import { createHttpClient } from './client';

/** The backend token from the NextAuth session cookie; it never reaches the browser. */
async function readAccessToken(): Promise<string | undefined> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    cookieName: SESSION_COOKIE,
    salt: SESSION_COOKIE,
  });
  return token?.accessToken;
}

/** Server client: forwards the signed-in customer's backend token as the bearer token. */
export const serverHttp = createHttpClient({
  baseUrl: env.serverApiUrl,
  getToken: readAccessToken,
});
