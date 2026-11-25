import "server-only";

import { auth } from "@/auth";
import { rewardsApi } from "./api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import type { RewardCardsData, RewardCatalogData, RewardsSummary } from "./model";

export function getRewardsSummary(): Promise<RewardsSummary> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getSummary(session.user.id);
  });
}

export function getRewardCards(): Promise<RewardCardsData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getCards(session.user.id);
  });
}

export function getRewardCatalog(): Promise<RewardCatalogData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getCatalog(session.user.id);
  });
}
