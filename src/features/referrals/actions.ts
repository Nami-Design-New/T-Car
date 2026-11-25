"use server";

import { auth } from "@/auth";
import { referralsApi } from "./api";
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
  isReferralCodeFormat,
  normalizeReferralCode,
  type ReferralCodeCheck,
  type ReferralInvite,
} from "./model";

/** Loads one referral-history page for the shared infinite list. */
export async function getReferralHistoryAction(
  page: number,
): Promise<ActionResult<Page<ReferralInvite>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (!Number.isInteger(page) || page < 1) throw new AppError("validation");
    return toActionResult(
      ok((await referralsApi.getHistory(session.user.id, page)).page),
    );
  } catch (error) {
    reportError(error, { scope: "referrals.history" });
    return toActionResult(fail(error));
  }
}

/**
 * Checks an invite code while signing up (no session yet). A code in the
 * wrong shape is invalid without a request. A valid code is sent with the
 * profile when the customer completes sign-up.
 */
export async function checkReferralCodeAction(
  value: string,
): Promise<ActionResult<ReferralCodeCheck>> {
  const code = normalizeReferralCode(String(value));
  if (!isReferralCodeFormat(code)) {
    return toActionResult(ok({ valid: false }));
  }
  try {
    return toActionResult(ok(await referralsApi.checkCode(code)));
  } catch (error) {
    reportError(error, { scope: "referrals.checkCode" });
    return toActionResult(fail(error));
  }
}
