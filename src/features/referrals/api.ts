import "server-only";

import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type {
  ReferralCodeCheck,
  ReferralHistory,
  ReferralProgram,
} from "./model";
import { referralsMock } from "./api.mock";

export interface ReferralsApi {
  getProgram(userId: string): Promise<ReferralProgram>;
  getHistory(userId: string): Promise<ReferralHistory>;
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

// The program reads the live endpoint; history and code checks stay mocked
// until their integration fractions.
export const referralsApi: ReferralsApi = { ...referralsMock, getProgram };
