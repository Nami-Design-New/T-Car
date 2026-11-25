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
  invitedCount: 3,
  completedCount: 2,
  page: {
    page: 1,
    lastPage: 1,
    total: 3,
    items: [
      {
        id: "invite-3",
        friendName: "أحمد م.",
        joinedAt: "2026-10-24T00:00:00.000Z",
        firstBookingAt: null,
        rewardPoints: null,
        status: "pending",
      },
      {
        id: "invite-2",
        friendName: "سارة ع.",
        joinedAt: "2026-10-20T00:00:00.000Z",
        firstBookingAt: "2026-10-30T00:00:00.000Z",
        rewardPoints: 500,
        status: "rewarded",
      },
      {
        id: "invite-1",
        friendName: "خالد س.",
        joinedAt: "2026-09-12T00:00:00.000Z",
        firstBookingAt: "2026-09-18T00:00:00.000Z",
        rewardPoints: 500,
        status: "rewarded",
      },
    ],
  },
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

  async getHistory(userId, page) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "referrals.unavailable");
    }
    if (userId === MOCK_EMPTY_HISTORY_USER_ID) {
      return {
        totalPoints: 0,
        invitedCount: 0,
        completedCount: 0,
        page: { items: [], page, lastPage: 1, total: 0 },
      };
    }

    return {
      totalPoints: MOCK_REFERRAL_HISTORY.totalPoints,
      invitedCount: MOCK_REFERRAL_HISTORY.invitedCount,
      completedCount: MOCK_REFERRAL_HISTORY.completedCount,
      page: {
        items: page === 1
          ? MOCK_REFERRAL_HISTORY.page.items.map((invite) => ({ ...invite }))
          : [],
        page,
        lastPage: 1,
        total: MOCK_REFERRAL_HISTORY.page.total,
      },
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
