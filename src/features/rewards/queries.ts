import "server-only";

import { auth } from "@/auth";
import { rewardsApi } from "./api";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import type { RewardCardFilter, RewardCardsData, RewardCatalogData, RewardTier, RewardsHomeData, RewardsSummary } from "./model";

export function getRewardsHome(): Promise<RewardsHomeData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getHome(session.user.id);
  });
}

export function getRewardsSummary(): Promise<RewardsSummary> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getSummary(session.user.id);
  });
}

export function getRewardTier(id: string): Promise<RewardTier | null> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getTier(session.user.id, id);
  });
}

export function getRewardCards(filter: RewardCardFilter): Promise<RewardCardsData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getCards(session.user.id, filter);
  });
}

export function getRewardCatalog(): Promise<RewardCatalogData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");

    return rewardsApi.getCatalog(session.user.id);
  });
}
