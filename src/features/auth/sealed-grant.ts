import "server-only";
import { decode, encode } from "next-auth/jwt";
import type { AuthGrant } from "./model";

/**
 * A verified grant (the backend token and its user), encrypted with
 * `AUTH_SECRET` so it can pass through a cookie or the public `grant` sign-in
 * provider without the browser reading or forging it. `salt` keeps each use's
 * values apart: one sealed for the pending-registration cookie is not a sign-in.
 */
export async function sealGrant(
  grant: AuthGrant,
  salt: string,
  maxAgeSeconds: number,
): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return encode({ token: { grant }, secret, salt, maxAge: maxAgeSeconds });
}

/** The grant inside a sealed value; null when it is forged, expired, or malformed. */
export async function unsealGrant(
  value: string,
  salt: string,
): Promise<AuthGrant | null> {
  const secret = process.env.AUTH_SECRET;
  if (!value || !secret) return null;
  try {
    const token = await decode({ token: value, secret, salt });
    return isAuthGrant(token?.grant) ? token.grant : null;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isAuthGrant(value: unknown): value is AuthGrant {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  const { user } = value;
  return (
    typeof value.accessToken === "string" &&
    value.accessToken !== "" &&
    typeof value.onboardingStep === "string" &&
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.phone === "string" &&
    (user.email === undefined || typeof user.email === "string")
  );
}
