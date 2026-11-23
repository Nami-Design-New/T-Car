import type {
  ReferralHistory,
  ReferralProgram,
} from "@/features/referrals/model";
import { AppError } from "@/shared/lib/errors";
import type { ReferralsApi } from "../referrals.api";

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
};
