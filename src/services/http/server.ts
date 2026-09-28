import 'server-only';
import { cookies } from 'next/headers';
import { env } from '@/shared/config/env';
import { createHttpClient } from './client';

export const SESSION_COOKIE = 'tcar_session';

/** Server client: forwards the httpOnly session cookie as the bearer token. */
export const serverHttp = createHttpClient({
  baseUrl: env.serverApiUrl,
  getToken: async () => (await cookies()).get(SESSION_COOKIE)?.value,
});
