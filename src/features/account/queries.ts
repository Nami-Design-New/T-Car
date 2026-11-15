import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { accountApi } from "./api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import type { SavedLocation } from "@/shared/lib/location";
import type { UserProfile } from "./model";

/** One `/profile` read per request, shared by the layout and the page. */
const readProfile = cache(() => accountApi.getProfile());

/** The signed-in customer's profile. The middleware guards the page; this is the real check. */
export function getProfile(): Promise<UserProfile> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return readProfile();
  });
}

/**
 * Whether the signed-in customer has a driving license on file, for the
 * booking gate on public pages. `null` for a guest or when the profile cannot
 * be read: the page must not redirect or fail for this, and the backend still
 * decides at booking time.
 */
export async function getLicenseStatus(): Promise<boolean | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    const profile = await readProfile();
    return profile.licenseUploaded;
  } catch {
    return null;
  }
}

/**
 * The signed-in customer's saved location, which public requests send instead
 * of the browser's. `null` when they have none or the profile cannot be read:
 * the requests then go without a location and the backend uses its default.
 */
export async function getSavedLocation(): Promise<SavedLocation | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    const profile = await readProfile();
    return profile.location;
  } catch {
    return null;
  }
}
