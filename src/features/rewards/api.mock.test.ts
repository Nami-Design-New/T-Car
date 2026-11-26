import { describe, expect, it, vi } from "vitest";
import { rewardsMock } from "./api.mock";

vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));

describe("rewardsMock.getSummary", () => {
  it("returns API-shaped packages with data-owned names, icons, colours and perk keys", async () => {
    const summary = await rewardsMock.getSummary("customer-1");
    expect(summary.tiers[0]).toMatchObject({
      id: "1",
      name: "Bronze",
      iconUrl: "/images/rewards/badge-bronze.webp",
      colors: { high: "#F3C29B", medium: "#C8794A", low: "#7A3E1D" },
      startPoints: 1000,
      endPoints: 4999,
      perks: [{ key: "bronze_welcome", title: "You've just started, champ!" }],
    });
    expect(summary.tiers[0].perks[0]).not.toHaveProperty("description");
  });
});

describe("rewardsMock.getRedemptionQuote", () => {
  it("previews the balance change and the current tier without spending", async () => {
    const before = await rewardsMock.getCatalog("customer-1");
    const quote = await rewardsMock.getRedemptionQuote(
      "customer-1",
      "discount-100",
    );
    const after = await rewardsMock.getCatalog("customer-1");

    expect(quote).toEqual({
      balanceBefore: 4000,
      pointsCost: 1900,
      balanceAfter: 2100,
      tierName: "Gold",
    });
    expect(after.balance).toBe(before.balance);
  });

  it("rejects an unknown card, the documented failure, and the expensive card", async () => {
    await expect(
      rewardsMock.getRedemptionQuote("customer-1", "unknown"),
    ).rejects.toMatchObject({
      kind: "not_found",
      code: "rewards.cardUnavailable",
    });
    await expect(
      rewardsMock.getRedemptionQuote("rewards-failure", "discount-50"),
    ).rejects.toMatchObject({ kind: "network", code: "rewards.unavailable" });
    await expect(
      rewardsMock.getRedemptionQuote("customer-1", "discount-failure"),
    ).rejects.toMatchObject({ kind: "network", code: "rewards.unavailable" });
    await expect(
      rewardsMock.getRedemptionQuote("customer-1", "discount-300"),
    ).rejects.toMatchObject({
      kind: "validation",
      code: "rewards.insufficientPoints",
    });
  });
});

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
