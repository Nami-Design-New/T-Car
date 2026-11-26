import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get } }));

import { pointsApi } from "./api";

const transaction = {
  id: 7,
  type: "earned",
  point_type: "booking_reward",
  title: "Booking points",
  points: 200,
  order_id: 2363,
  discount_card_id: null,
  discount_value: null,
  date: "2026-11-25 12:18:04",
};
const data = {
  level_points: 12000,
  can_replaced_points: 4000,
  last_replaced_points: 0,
  transactions: [transaction],
};
const pagination = {
  current_page: 1,
  last_page: 2,
  per_page: 10,
  total: 11,
  from: 1,
  to: 10,
};
const envelope = (payload: unknown) => ({
  data: payload,
  message: "OK",
  code: 200,
});
/** A success response with pagination beside `data` (B2 answer). */
const page = (payload: unknown) => ({ ...envelope(payload), pagination });

describe("pointsApi", () => {
  it.each([
    ["all", 1, { page: 1, per_page: 10 }],
    ["earned", 2, { page: 2, per_page: 10, filter: "earned" }],
    ["spent", 3, { page: 3, per_page: 10, filter: "used" }],
  ] as const)("requests %s page %i", async (filter, pageNumber, query) => {
    get.mockResolvedValueOnce(page(data));
    await pointsApi.getPoints("user-1", pageNumber, filter);
    expect(get).toHaveBeenCalledWith("/points", { query });
  });

  it("maps balances, a signed amount, and Riyadh time", async () => {
    get.mockResolvedValueOnce(page(data));
    await expect(pointsApi.getPoints("user-1", 1, "all")).resolves.toEqual({
      summary: { tierPoints: 12000, balance: 4000, lastRedemption: null },
      page: {
        page: 1,
        lastPage: 2,
        total: 11,
        items: [
          {
            id: "7",
            type: "earned",
            title: "Booking points",
            amount: 200,
            createdAt: "2026-11-25T12:18:04+03:00",
            source: { kind: "booking", bookingId: "2363" },
          },
        ],
      },
    });
  });

  it.each([
    ["booking_reward", "booking", 2363, 50],
    ["rate_reward", "rating", 2363, 50],
    ["referral_reward", "referral", null, 50],
    ["replace", "redemption", null, 50],
  ] as const)("maps %s", async (pointType, kind, orderId, discountValue) => {
    get.mockResolvedValueOnce(
      page({
        ...data,
        transactions: [
          {
            ...transaction,
            type: pointType === "replace" ? "used" : "earned",
            point_type: pointType,
            order_id: orderId,
            discount_value: discountValue,
            points: pointType === "replace" ? -1000 : 200,
          },
        ],
      }),
    );
    const result = await pointsApi.getPoints("user-1", 1, "all");
    expect(result.page.items[0].source).toMatchObject({ kind });
    expect(result.page.items[0].amount).toBe(
      pointType === "replace" ? -1000 : 200,
    );
  });

  it("maps missing order and discount links to nullable source fields", async () => {
    get.mockResolvedValueOnce(
      page({ ...data, transactions: [{ ...transaction, order_id: null }] }),
    );
    expect(
      (await pointsApi.getPoints("user-1", 1, "all")).page.items[0].source,
    ).toEqual({ kind: "booking", bookingId: null });
  });

  it.each([
    [
      "malformed item",
      page({ ...data, transactions: [{ ...transaction, points: "200" }] }),
    ],
    [
      "bad date",
      page({
        ...data,
        transactions: [{ ...transaction, date: "2026-02-30 12:18:04" }],
      }),
    ],
    ["missing pagination", envelope(data)],
  ])("rejects %s", async (_name, response) => {
    get.mockResolvedValueOnce(response);
    await expect(pointsApi.getPoints("user-1", 1, "all")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates a 401 unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(pointsApi.getPoints("user-1", 1, "all")).rejects.toBe(error);
  });

  it("reads the summary with per_page=1", async () => {
    get.mockResolvedValueOnce(page(data));
    await expect(pointsApi.getSummary("user-1")).resolves.toEqual({
      tierPoints: 12000,
      balance: 4000,
      lastRedemption: null,
    });
    expect(get).toHaveBeenCalledWith("/points", {
      query: { page: 1, per_page: 1 },
    });
  });
});
