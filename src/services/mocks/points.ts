import type { PointsData } from "@/features/points/model";
import { AppError } from "@/shared/lib/errors";
import type { PointsApi } from "../points.api";

export const MOCK_POINTS_DATA: PointsData = {
  summary: {
    tierPoints: 12000,
    balance: 4000,
    lastRedemption: 1000,
  },
  transactions: [
    {
      id: "redemption-2",
      type: "spent",
      amount: -1000,
      createdAt: "2026-09-28T13:30:00.000Z",
      source: { kind: "redemption", discountAmount: 50 },
    },
    {
      id: "booking-2363-redeemable",
      type: "earned",
      amount: 200,
      createdAt: "2026-09-28T13:30:00.000Z",
      source: { kind: "booking", bookingId: "2363", balance: "redeemable" },
    },
    {
      id: "booking-2363-tier",
      type: "earned",
      amount: 200,
      createdAt: "2026-09-28T13:30:00.000Z",
      source: { kind: "booking", bookingId: "2363", balance: "tier" },
    },
    {
      id: "referral-1",
      type: "earned",
      amount: 500,
      createdAt: "2026-09-28T13:30:00.000Z",
      source: { kind: "referral", friendName: "أحمد" },
    },
    {
      id: "redemption-1",
      type: "spent",
      amount: -1000,
      createdAt: "2026-09-02T10:20:00.000Z",
      source: { kind: "redemption", discountAmount: 50 },
    },
    {
      id: "expiry-1",
      type: "expired",
      amount: -150,
      createdAt: "2026-08-01T00:00:00.000Z",
      source: { kind: "expiry" },
    },
  ],
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable points service response. */
const MOCK_FAILURE_USER_ID = "points-failure";

export const pointsMock: PointsApi = {
  async getPoints(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError("network", "points.unavailable");
    }

    return {
      summary: { ...MOCK_POINTS_DATA.summary },
      transactions: MOCK_POINTS_DATA.transactions.map((transaction) => ({
        ...transaction,
        source: { ...transaction.source },
      })),
    };
  },
};
