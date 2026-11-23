import type { ReferralProgram } from "@/features/referrals/model";
import { AppError } from "@/shared/lib/errors";
import type { ReferralsApi } from "../referrals.api";

export const MOCK_REFERRAL_PROGRAM: ReferralProgram = {
  code: "TCAR-A7K9",
  rewardPoints: 500,
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable referrals service response. */
const MOCK_FAILURE_USER_ID = "referrals-failure";

// Read-only and stateless: it runs on the server, so it keeps no per-user state.
export const referralsMock: ReferralsApi = {
  async getProgram(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "referrals.unavailable");
    }

    return { ...MOCK_REFERRAL_PROGRAM };
  },
};
