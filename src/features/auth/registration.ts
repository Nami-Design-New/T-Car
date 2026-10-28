import "server-only";
import { cookies } from "next/headers";
import {
  SECURE_SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/shared/config/session";
import type { AuthGrant } from "./model";
import { sealGrant, unsealGrant } from "./sealed-grant";

/**
 * A verified phone whose profile is still missing. There is no session until
 * the profile is saved, so the backend token (issued at verification, needed
 * by `/complete-profile`) waits here, encrypted and httpOnly. Closing the form
 * discards it; the customer then verifies a new code.
 */
const PENDING_REGISTRATION = `${SECURE_SESSION_COOKIE ? "__Secure-" : ""}tcar.pending-registration`;

/** Long enough to fill in the profile form. */
const MAX_AGE_SECONDS = 30 * 60;

export async function savePendingRegistration(grant: AuthGrant): Promise<void> {
  const value = await sealGrant(grant, PENDING_REGISTRATION, MAX_AGE_SECONDS);
  (await cookies()).set(PENDING_REGISTRATION, value, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: MAX_AGE_SECONDS,
  });
}

/** The pending grant; null when there is none, or it expired. */
export async function readPendingRegistration(): Promise<AuthGrant | null> {
  const value = (await cookies()).get(PENDING_REGISTRATION)?.value;
  return value ? unsealGrant(value, PENDING_REGISTRATION) : null;
}

export async function clearPendingRegistration(): Promise<void> {
  const store = await cookies();
  if (store.has(PENDING_REGISTRATION)) {
    store.set(PENDING_REGISTRATION, "", {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }
}
