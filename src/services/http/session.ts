import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { getLocale } from "next-intl/server";
import {
  NEXT_PATH_HEADER,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_EXPIRED,
  SESSION_PROOF_PARAM,
} from "@/shared/config/session";
import { toAppError } from "@/shared/lib/errors";
import { sessionProof } from "@/shared/lib/session-proof";

/** The backend token from the NextAuth session cookie; it never reaches the browser. */
export async function readAccessToken(): Promise<string | undefined> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    cookieName: SESSION_COOKIE,
    salt: SESSION_COOKIE,
  });
  return token?.accessToken;
}

/**
 * Deletes the session cookie (and any Auth.js chunks of it) after the backend
 * rejected its token. Only a Server Action or Route Handler can write cookies;
 * while a page renders this does nothing, and `protectedRead` redirects instead.
 */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  try {
    for (const { name } of store.getAll()) {
      if (name.startsWith(SESSION_COOKIE))
        store.set(name, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    }
  } catch {
    // Read-only cookies: rendering a page.
  }
}

/**
 * Sends the visitor to `?auth=expired`, where the middleware clears the dead
 * session and opens the sign-in dialog, then back to this page after sign-in.
 * The proof ties the link to this session, so nobody else can send it.
 */
export async function redirectToSignIn(): Promise<never> {
  const next = (await headers()).get(NEXT_PATH_HEADER);
  const accessToken = await readAccessToken();
  const secret = process.env.AUTH_SECRET;
  const params = new URLSearchParams({ auth: SESSION_EXPIRED });
  if (accessToken && secret) {
    params.set(SESSION_PROOF_PARAM, await sessionProof(accessToken, secret));
  }
  if (next) params.set("next", next);
  redirect(`/${await getLocale()}?${params}`);
}

/**
 * A read that needs the signed-in customer: `unauthorized` (no session, or a
 * token the backend rejected) signs the visitor in again instead of reaching
 * error.tsx. Other failures throw as they are.
 */
export async function protectedRead<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (toAppError(error).kind === "unauthorized") return redirectToSignIn();
    throw error;
  }
}
