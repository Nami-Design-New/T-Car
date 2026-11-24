"use server";

import { auth } from "@/auth";
import { rewardsApi } from "@/services/rewards.api";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import { fail, toActionResult, type ActionResult } from "@/shared/lib/result";
import type { RewardRedemption } from "./model";

/** Redeems a server-owned catalog item; only its id crosses from the client. */
export async function redeemRewardAction(
  itemId: string,
): Promise<ActionResult<RewardRedemption>> {
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
