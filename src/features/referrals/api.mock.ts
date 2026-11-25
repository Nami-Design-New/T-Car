import type {
  ReferralHistory,
  ReferralProgram,
} from "./model";
import { AppError } from "@/shared/lib/errors";
import type { ReferralsApi } from "./api";

export const MOCK_REFERRAL_PROGRAM: ReferralProgram = {
  code: "TCAR-A7K9",
  rewardPoints: 500,
};

export const MOCK_REFERRAL_HISTORY: ReferralHistory = {
  totalPoints: 1000,
  invites: [
    {
      id: "invite-3",
      friendName: "أحمد م.",
      joinedAt: "2026-10-24T00:00:00.000Z",
      firstBookingAt: null,
      rewardPoints: null,
    },
    {
      id: "invite-2",
      friendName: "سارة ع.",
      joinedAt: "2026-10-20T00:00:00.000Z",
      firstBookingAt: "2026-10-30T00:00:00.000Z",
      rewardPoints: 500,
    },
    {
      id: "invite-1",
      friendName: "خالد س.",
      joinedAt: "2026-09-12T00:00:00.000Z",
      firstBookingAt: "2026-09-18T00:00:00.000Z",
      rewardPoints: 500,
    },
  ],
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable referrals service response. */
const MOCK_FAILURE_USER_ID = "referrals-failure";
/** Mock only: this test id has a code but no invites yet (the empty history). */
const MOCK_EMPTY_HISTORY_USER_ID = "referrals-empty";
/** Mock only: the friend whose code `MOCK_REFERRAL_PROGRAM.code` is. */
const MOCK_INVITER_NAME = "أحمد";
/** Mock only: checking this code reproduces an unreachable service. */
const MOCK_FAILURE_CODE = "TCAR-FAIL";

// Read-only and stateless: it runs on the server, so it keeps no per-user state.
export const referralsMock: ReferralsApi = {
  async getProgram(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "referrals.unavailable");
    }

    return { ...MOCK_REFERRAL_PROGRAM };
  },

  async getHistory(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "referrals.unavailable");
    }
    if (userId === MOCK_EMPTY_HISTORY_USER_ID) {
      return { totalPoints: 0, invites: [] };
    }

    return {
      totalPoints: MOCK_REFERRAL_HISTORY.totalPoints,
      invites: MOCK_REFERRAL_HISTORY.invites.map((invite) => ({ ...invite })),
    };
  },

  async checkCode(code) {
    await delay(400);
    if (code === MOCK_FAILURE_CODE) {
      throw new AppError("network", "referrals.unavailable");
    }

    return code === MOCK_REFERRAL_PROGRAM.code
      ? { valid: true, inviterName: MOCK_INVITER_NAME }
      : { valid: false };
  },
};
