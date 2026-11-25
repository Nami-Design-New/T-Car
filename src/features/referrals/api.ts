import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp, serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage } from "@/shared/lib/pagination";
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

interface ReferalInfoDto {
  referal_code: string;
  referal_reword_value: number;
}

function isReferalInfoDto(value: unknown): value is ReferalInfoDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "referal_code" in value &&
    typeof value.referal_code === "string" &&
    value.referal_code.trim() !== "" &&
    "referal_reword_value" in value &&
    typeof value.referal_reword_value === "number" &&
    Number.isFinite(value.referal_reword_value) &&
    value.referal_reword_value >= 0
  );
}

function toReferralProgram(dto: ReferalInfoDto): ReferralProgram {
  return { code: dto.referal_code, rewardPoints: dto.referal_reword_value };
}

async function getProgram(): Promise<ReferralProgram> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/referal-info");
  if (!isApiEnvelope(response) || !isReferalInfoDto(response.data)) {
    throw new AppError("server");
  }
  return toReferralProgram(response.data);
}

interface ReferalRewordDto {
  id: number;
  user_name: string;
  points: number | null;
  status: "pending" | "applied";
  joint_at: string;
  first_order_at: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

function isReferalRewordDto(value: unknown): value is ReferalRewordDto {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    typeof value.user_name === "string" &&
    (value.points === null || isCount(value.points)) &&
    (value.status === "pending" || value.status === "applied") &&
    typeof value.joint_at === "string" &&
    (value.first_order_at === null || typeof value.first_order_at === "string")
  );
}

function toReferralInvite(dto: ReferalRewordDto): ReferralInvite {
  return {
    id: String(dto.id),
    friendName: dto.user_name,
    joinedAt: dto.joint_at,
    firstBookingAt: dto.first_order_at,
    rewardPoints: dto.points,
    status: dto.status === "applied" ? "rewarded" : "pending",
  };
}

/** Validates the live counts, invite rows, and nested pagination. */
export function mapReferralHistoryResponse(value: unknown): ReferralHistory {
  if (!isApiEnvelope(value) || value.code !== 200 || !isRecord(value.data)) {
    throw new AppError("server");
  }
  const data = value.data;
  if (
    !Array.isArray(data.referal_rewords) ||
    !data.referal_rewords.every(isReferalRewordDto) ||
    !isCount(data.referal_rewords_count) ||
    !isCount(data.applied_referal_rewords_count) ||
    !isCount(data.referal_points) ||
    !isPaginationDto(data.pagination)
  ) {
    throw new AppError("server");
  }
  return {
    totalPoints: data.referal_points,
    invitedCount: data.referal_rewords_count,
    completedCount: data.applied_referal_rewords_count,
    page: toPage(data.referal_rewords.map(toReferralInvite), data.pagination),
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
    if (
      !isApiEnvelope(response) ||
      response.code !== 200 ||
      !isRecord(response.data) ||
      response.data.valid !== true ||
      (response.data.referrer_name !== null &&
        typeof response.data.referrer_name !== "string")
    ) {
      throw new AppError("server");
    }
    // A blank name is shown as no name (the no-name hint and banner).
    return {
      valid: true,
      inviterName: response.data.referrer_name?.trim() || null,
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
