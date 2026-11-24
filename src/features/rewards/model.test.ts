import { describe, expect, it } from "vitest";
import {
  canAffordReward,
  isRewardTierId,
  rewardTierView,
  rewardsOverview,
  type RewardTier,
} from "./model";

const tiers: RewardTier[] = [
  { id: "bronze", threshold: 1000, perks: [] },
  {
    id: "silver",
    threshold: 5000,
    perks: [
      {
        id: "silver-1",
        title: "Silver perk",
        description: "Silver description",
        icon: "calendar",
      },
    ],
  },
  {
    id: "gold",
    threshold: 10000,
    perks: [
      {
        id: "gold-1",
        title: "Gold perk",
        description: "Gold description",
        icon: "tag",
      },
    ],
  },
  {
    id: "diamond",
    threshold: 20000,
    perks: [
      {
        id: "diamond-1",
        title: "Diamond perk",
        description: "Diamond description",
        icon: "gift",
      },
    ],
  },
];

const overview = (tierPoints: number, list = tiers) =>
  rewardsOverview({ tierPoints, balance: 0, tiers: list });

describe("rewardTierView", () => {
  const summary = (tierPoints: number) => ({
    tierPoints,
    balance: 0,
    tiers: [...tiers].reverse(),
  });
  it("identifies valid tier ids", () => {
    expect(isRewardTierId("gold")).toBe(true);
    expect(isRewardTierId("platinum")).toBe(false);
  });
  it("uses overview progress for current and 100% for reached", () => {
    expect(rewardTierView(summary(5000), "silver")).toMatchObject({
      state: "current",
      progress: 50,
      pointsLeft: 5000,
      next: { id: "gold" },
    });
    expect(rewardTierView(summary(5000), "bronze")).toMatchObject({
      state: "reached",
      progress: 100,
      pointsLeft: 0,
    });
  });
  it("calculates locked progress against its own threshold", () => {
    expect(rewardTierView(summary(5000), "gold")).toMatchObject({
      state: "locked",
      progress: 50,
      pointsLeft: 5000,
    });
  });
  it("keeps Bronze current and Silver locked at zero points", () => {
    expect(rewardTierView(summary(0), "bronze")).toMatchObject({
      state: "current",
    });
    expect(rewardTierView(summary(0), "silver")).toMatchObject({
      state: "locked",
      progress: 0,
    });
  });
  it("completes the top tier and has no next tier", () => {
    expect(rewardTierView(summary(25000), "diamond")).toMatchObject({
      state: "current",
      progress: 100,
      pointsLeft: 0,
      next: null,
    });
  });
});

describe("canAffordReward", () => {
  const item = {
    id: "discount-100",
    discountAmount: 100,
    pointsCost: 1900,
    validityDays: 90,
  };

  it("allows an exact balance and rejects a lower one", () => {
    expect(canAffordReward(1900, item)).toBe(true);
    expect(canAffordReward(1899, item)).toBe(false);
  });
});

describe("rewardsOverview", () => {
  it("uses Bronze below the first threshold and the highest reached tier", () => {
    expect(overview(0).current.id).toBe("bronze");
    expect(overview(4999).current.id).toBe("bronze");
    expect(overview(5000).current.id).toBe("silver");
    expect(overview(19999).current.id).toBe("gold");
  });

  it("finds the next tier, the points left, and the progress", () => {
    const result = overview(5000);
    expect(result.next?.id).toBe("gold");
    expect(result.pointsToNext).toBe(5000);
    expect(result.progress).toBe(50);
    expect(overview(-1).progress).toBe(0);
  });

  it("marks each tier reached, current, or locked", () => {
    expect(overview(5000).tiers.map(({ state }) => state)).toEqual([
      "reached",
      "current",
      "locked",
      "locked",
    ]);
  });

  it("sorts tiers that arrive out of order", () => {
    const result = overview(5000, [...tiers].reverse());
    expect(result.tiers.map(({ tier }) => tier.id)).toEqual([
      "bronze",
      "silver",
      "gold",
      "diamond",
    ]);
    expect(result.current.id).toBe("silver");
    expect(result.roadPosition).toBe(50);
  });

  it("places the car halfway from the current tier to the next", () => {
    expect(overview(0).roadPosition).toBeCloseTo(100 / 6);
    expect(overview(1000).roadPosition).toBeCloseTo(100 / 6);
    expect(overview(7500).roadPosition).toBe(50);
    expect(overview(12000).roadPosition).toBeCloseTo(250 / 3);
  });

  it("handles the top tier as complete with nothing left", () => {
    const result = overview(25000);
    expect(result.current.id).toBe("diamond");
    expect(result.next).toBeNull();
    expect(result.progress).toBe(100);
    expect(result.pointsToNext).toBe(0);
    expect(result.roadPosition).toBe(100);
  });
});
