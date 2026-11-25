"use server";

import { referralsApi } from "./api";
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
} from "./model";

/**
 * Checks an invite code while signing up (no session yet). A code in the
 * wrong shape is invalid without a request. The result is only shown: the
 * code is not sent with the profile until the backend takes it
 * (docs/api/Auth-API.md, open questions).
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
