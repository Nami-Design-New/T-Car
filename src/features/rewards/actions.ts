"use server";

import { auth } from "@/auth";
import { rewardsApi } from "./api";
import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import {
  REWARD_CARD_FILTERS,
  type RewardCard,
  type RewardCardFilter,
  type RewardRedemptionData,
  type RewardRedemptionQuote,
} from "./model";

export async function getRewardCardsPageAction(
  page: number,
  filter: RewardCardFilter,
): Promise<ActionResult<Page<RewardCard>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !REWARD_CARD_FILTERS.includes(filter)
    ) {
      throw new AppError("validation");
    }
    return toActionResult(
      ok(await rewardsApi.getCardsPage(session.user.id, page, filter)),
    );
  } catch (error) {
    reportError(error, { scope: "rewards.cards" });
    return toActionResult(fail(error));
  }
}

/** Redeems a server-owned catalog item; only its id crosses from the client. */
export async function redeemRewardAction(
  itemId: string,
): Promise<ActionResult<RewardRedemptionData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (
      typeof itemId !== "string" ||
      itemId.length === 0 ||
      itemId.length > 100
    ) {
      throw new AppError("validation", "rewards.cardUnavailable");
    }
    const result = await rewardsApi.redeem(session.user.id, itemId);
    if (!result.ok) reportError(result.error, { scope: "rewards.redeem" });
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "rewards.redeem" });
    return toActionResult(fail(error));
  }
}

/** E11 preview for the confirm dialog; it spends nothing. */
export async function getRedemptionQuoteAction(
  itemId: string,
): Promise<ActionResult<RewardRedemptionQuote>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (
      typeof itemId !== "string" ||
      itemId.length === 0 ||
      itemId.length > 100
    ) {
      throw new AppError("validation", "rewards.cardUnavailable");
    }
    return toActionResult(
      ok(await rewardsApi.getRedemptionQuote(session.user.id, itemId)),
    );
  } catch (error) {
    reportError(error, { scope: "rewards.quote" });
    return toActionResult(fail(error));
  }
}
