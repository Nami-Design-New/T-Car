import "server-only";
import { auth } from "@/auth";
import { accountApi } from "./api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import type { UserProfile } from "./model";

/** The signed-in customer's profile. The middleware guards the page; this is the real check. */
export function getProfile(): Promise<UserProfile> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return accountApi.getProfile();
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
    const profile = await accountApi.getProfile();
    return profile.licenseUploaded;
  } catch {
    return null;
  }
}
