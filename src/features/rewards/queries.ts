import "server-only";

import { auth } from "@/auth";
import { rewardsApi } from "@/services/rewards.api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import type { RewardsSummary } from "./model";

export function getRewardsSummary(): Promise<RewardsSummary> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getSummary(session.user.id);
  });
}
