import "server-only";

import { auth } from "@/auth";
import type { ReferralHistory, ReferralProgram } from "./model";
import { referralsApi } from "@/services/referrals.api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";

export function getReferralProgram(): Promise<ReferralProgram> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return referralsApi.getProgram(session.user.id);
  });
}

export function getReferralHistory(): Promise<ReferralHistory> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return referralsApi.getHistory(session.user.id);
  });
}
