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
    return accountApi.getProfile(session.user.id);
  });
}
