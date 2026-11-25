import { describe, expect, it } from "vitest";
import { MOCK_POINTS_DATA } from "./api.mock";
import {
  groupPointsTransactions,
  pointsSourceHref,
  type PointsTransaction,
} from "./model";

const tx = (
  id: string,
  createdAt: string,
  type: PointsTransaction["type"] = "earned",
): PointsTransaction => ({
  id,
  type,
  title: "Activity",
  amount: type === "earned" ? 100 : -100,
  createdAt,
  source: { kind: "referral" },
});

describe("groupPointsTransactions", () => {
  it("puts the three newest under latest and the rest by month", () => {
    const groups = groupPointsTransactions(MOCK_POINTS_DATA.page.items);
    expect(
      groups.map((group) => (group.kind === "latest" ? "latest" : group.month)),
    ).toEqual(["latest", "2026-09-01", "2026-08-01"]);
    expect(groups[0].transactions).toHaveLength(3);
    expect(groups[1].transactions.map((item) => item.id)).toEqual([
      "4",
    ]);
  });

  it("uses Saudi time for the month boundary", () => {
    // 22:00 UTC on 31 August is 01:00 on 1 September in Riyadh.
    const list = [
      tx("1", "2026-09-05T00:00:00Z"),
      tx("2", "2026-09-04T00:00:00Z"),
      tx("3", "2026-09-03T00:00:00Z"),
      tx("4", "2026-08-31T22:00:00Z"),
    ];
    const [, month] = groupPointsTransactions(list);
    expect(month).toMatchObject({ kind: "month", month: "2026-09-01" });
  });

  it("returns no groups for no movements", () => {
    expect(groupPointsTransactions([])).toEqual([]);
  });
});

describe("pointsSourceHref", () => {
  it("links bookings and invites only", () => {
    expect(
      pointsSourceHref({ kind: "booking", bookingId: "2363" }),
    ).toBe("/account/bookings/2363");
    expect(pointsSourceHref({ kind: "rating", bookingId: "2363" })).toBe("/account/bookings/2363");
    expect(pointsSourceHref({ kind: "booking", bookingId: null })).toBeNull();
    expect(pointsSourceHref({ kind: "rating", bookingId: null })).toBeNull();
    expect(pointsSourceHref({ kind: "referral" })).toBe(
      "/account/referrals/history",
    );
    expect(
      pointsSourceHref({ kind: "redemption", discountAmount: 50 }),
    ).toBeNull();
  });
});
