import "server-only";

import type { ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp, serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { apiCount, apiData, apiId, apiList, apiObject, apiPage, apiText } from "@/shared/lib/api-values";
import type {
  ReferralCodeCheck,
  ReferralHistory,
  ReferralInvite,
  ReferralProgram,
} from "./model";

export interface ReferralsApi {
  getProgram(userId: string): Promise<ReferralProgram>;
  getHistory(userId: string, page: number): Promise<ReferralHistory>;
  /** Checks a friend's code during sign-up (no session). Expects it normalized. */
  checkCode(code: string): Promise<ReferralCodeCheck>;
}

async function getProgram(): Promise<ReferralProgram> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/referal-info");
  const data = apiData(response);
  return {
    code: apiText(data.referal_code),
    rewardPoints: apiCount(data.referal_reword_value),
  };
}

function toReferralInvite(value: unknown, index: number): ReferralInvite {
  const dto = apiObject(value);
  return {
    id: apiId(dto.id, `invite-${index}`),
    friendName: apiText(dto.user_name),
    joinedAt: apiText(dto.joint_at),
    firstBookingAt: apiText(dto.first_order_at) || null,
    rewardPoints: dto.points == null ? null : apiCount(dto.points),
    status: dto.status === "applied" ? "rewarded" : "pending",
  };
}

/** Maps the fields the history screen uses, tolerating changed response fields. */
export function mapReferralHistoryResponse(value: unknown): ReferralHistory {
  const data = apiData(value);
  const invites = apiList(data.referal_rewords).map(toReferralInvite);
  return {
    totalPoints: apiCount(data.referal_points),
    invitedCount: apiCount(data.referal_rewords_count) || invites.length,
    completedCount: apiCount(data.applied_referal_rewords_count),
    page: apiPage(invites, value),
  };
}

const REFERRALS_PER_PAGE = 10;

async function getHistory(
  _userId: string,
  page: number,
): Promise<ReferralHistory> {
  if (!Number.isInteger(page) || page < 1) throw new AppError("validation");
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/referal-rewords",
    { query: { page, per_page: REFERRALS_PER_PAGE } },
  );
  return mapReferralHistoryResponse(response);
}

async function checkCode(code: string): Promise<ReferralCodeCheck> {
  try {
    const response = await publicServerHttp.post<ApiEnvelope<unknown>>(
      "/auth/verify-referal-code",
      { referal_code: code },
    );
    const data = apiData(response);
    if (data.valid !== true) return { valid: false };
    // A blank name is shown as no name (the no-name hint and banner).
    return {
      valid: true,
      inviterName: apiText(data.referrer_name).trim() || null,
    };
  } catch (error) {
    if (
      error instanceof AppError &&
      error.kind === "validation" &&
      error.status === 422
    ) {
      return { valid: false };
    }
    throw error;
  }
}

export const referralsApi: ReferralsApi = {
  getProgram,
  getHistory,
  checkCode,
};
