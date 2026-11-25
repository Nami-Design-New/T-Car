import { describe, expect, it } from "vitest";
import { rewardsMock } from "./api.mock";

describe("rewardsMock.redeem", () => {
  it("returns a receipt without mutating the server-side mock balance", async () => {
    const before = await rewardsMock.getCatalog("customer-1");
    const result = await rewardsMock.redeem("customer-1", "discount-50");
    const after = await rewardsMock.getCatalog("customer-1");

    expect(result).toMatchObject({
      ok: true,
      data: {
        card: {
          id: "redeemed-discount-50",
          code: "TCAR-305-Q9LD",
          discountAmount: 50,
          status: "active",
        },
        pointsCost: 1000,
        balanceBefore: 4000,
        balanceAfter: 3000,
        tierPoints: 12000,
        tierId: "gold",
      },
    });
    expect(after.balance).toBe(before.balance);
  });

  it("rejects unknown cards and reproduces the documented failure", async () => {
    expect(await rewardsMock.redeem("customer-1", "unknown")).toMatchObject({
      ok: false,
      error: { kind: "not_found", code: "rewards.cardUnavailable" },
    });
    expect(
      await rewardsMock.redeem("rewards-failure", "discount-50"),
    ).toMatchObject({
      ok: false,
      error: { kind: "network", code: "rewards.unavailable" },
    });
  });

  it("rejects the 300 SAR card, which costs more than the balance", async () => {
    expect(
      await rewardsMock.redeem("customer-1", "discount-300"),
    ).toMatchObject({
      ok: false,
      error: { kind: "conflict", code: "rewards.insufficientPoints" },
    });
  });

  it("fails the documented failure item with a network error", async () => {
    expect(
      await rewardsMock.redeem("customer-1", "discount-failure"),
    ).toMatchObject({
      ok: false,
      error: { kind: "network", code: "rewards.unavailable" },
    });
  });

  it("lists the catalog without the server-side codes", async () => {
    const { items } = await rewardsMock.getCatalog("customer-1");

    expect(items.map(({ id }) => id)).toEqual([
      "discount-50",
      "discount-100",
      "discount-200",
      "discount-300",
    ]);
    expect(items[0]).not.toHaveProperty("code");
  });
});
