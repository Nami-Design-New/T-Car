import type { PointsData } from "./model";
import { AppError } from "@/shared/lib/errors";
import type { PointsApi } from "./api";

export const MOCK_POINTS_DATA: PointsData = {
  summary: { tierPoints: 12000, balance: 4000, lastRedemption: 1000 },
  page: {
    page: 1,
    lastPage: 1,
    total: 5,
    items: [
      {
        id: "1",
        type: "used",
        title: "Redeemed a 50 SAR discount card",
        amount: -1000,
        createdAt: "2026-09-28T13:30:00+03:00",
        source: { kind: "redemption", discountAmount: 50 },
      },
      {
        id: "2",
        type: "earned",
        title: "Booking reward",
        amount: 200,
        createdAt: "2026-09-28T13:30:00+03:00",
        source: { kind: "booking", bookingId: "2363" },
      },
      {
        id: "3",
        type: "earned",
        title: "Rating reward",
        amount: 50,
        createdAt: "2026-09-28T13:30:00+03:00",
        source: { kind: "rating", bookingId: "2363" },
      },
      {
        id: "4",
        type: "earned",
        title: "Referral reward",
        amount: 500,
        createdAt: "2026-09-28T13:30:00+03:00",
        source: { kind: "referral" },
      },
      {
        id: "5",
        type: "used",
        title: "Redeemed points",
        amount: -1000,
        createdAt: "2026-08-02T10:20:00+03:00",
        source: { kind: "redemption", discountAmount: null },
      },
    ],
  },
};

/** Mock only: this test id reproduces an unavailable points service response. */
const MOCK_FAILURE_USER_ID = "points-failure";

export const pointsMock: PointsApi = {
  async getPoints(userId, page, filter) {
    if (userId === MOCK_FAILURE_USER_ID)
      throw new AppError("network", "points.unavailable");
    const items = MOCK_POINTS_DATA.page.items.filter(
      (item) =>
        filter === "all" ||
        item.type === (filter === "spent" ? "used" : "earned"),
    );
    return {
      summary: { ...MOCK_POINTS_DATA.summary },
      page: {
        items:
          page === 1
            ? items.map((item) => ({ ...item, source: { ...item.source } }))
            : [],
        page,
        lastPage: 1,
        total: items.length,
      },
    };
  },
  async getSummary(userId) {
    if (userId === MOCK_FAILURE_USER_ID)
      throw new AppError("network", "points.unavailable");
    return { ...MOCK_POINTS_DATA.summary };
  },
};
