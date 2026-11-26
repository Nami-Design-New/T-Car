import { describe, expect, it } from "vitest";
import {
  rewardsHomeOverview,
  rewardTierView,
  rewardsOverview,
  type RewardTier,
} from "./model";

const tier = (id: string, name: string, startPoints: number): RewardTier => ({
  id,
  name,
  iconUrl: `/badges/${id}.webp`,
  colors: { high: "#ffffff", medium: "#aaaaaa", low: "#555555" },
  startPoints,
  endPoints: startPoints + 4999,
  perks: [],
});
const tiers: RewardTier[] = [
  tier("1", "Bronze", 1000),
  tier("2", "Silver", 5000),
  tier("3", "Gold", 10000),
  tier("4", "Diamond", 20000),
];

const overview = (tierPoints: number, list = tiers) =>
  rewardsOverview({ tierPoints, balance: 0, tiers: list });

describe("rewardTierView", () => {
  const summary = (tierPoints: number) => ({
    tierPoints,
    balance: 0,
    tiers: [...tiers].reverse(),
  });
  it("accepts a tier id from the data rather than a fixed name", () => {
    expect(rewardTierView(summary(5000), "2").tier.name).toBe("Silver");
    expect(() => rewardTierView(summary(5000), "unknown")).toThrow();
  });
  it("uses overview progress for current and 100% for reached", () => {
    expect(rewardTierView(summary(5000), "2")).toMatchObject({
      state: "current",
      progress: 50,
      pointsLeft: 5000,
      next: { id: "3" },
    });
    expect(rewardTierView(summary(5000), "1")).toMatchObject({
      state: "reached",
      progress: 100,
      pointsLeft: 0,
    });
  });
  it("calculates locked progress against its own threshold", () => {
    expect(rewardTierView(summary(5000), "3")).toMatchObject({
      state: "locked",
      progress: 50,
      pointsLeft: 5000,
    });
  });
  it("keeps Bronze current and Silver locked at zero points", () => {
    expect(rewardTierView(summary(0), "1")).toMatchObject({
      state: "current",
    });
    expect(rewardTierView(summary(0), "2")).toMatchObject({
      state: "locked",
      progress: 0,
    });
  });
  it("completes the top tier and has no next tier", () => {
    expect(rewardTierView(summary(25000), "4")).toMatchObject({
      state: "current",
      progress: 100,
      pointsLeft: 0,
      next: null,
    });
  });
});

describe("rewardsOverview", () => {
  it("uses Bronze below the first threshold and the highest reached tier", () => {
    expect(overview(0).current.id).toBe("1");
    expect(overview(4999).current.id).toBe("1");
    expect(overview(5000).current.id).toBe("2");
    expect(overview(19999).current.id).toBe("3");
  });

  it("finds the next tier, the points left, and the progress", () => {
    const result = overview(5000);
    expect(result.next?.id).toBe("3");
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
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(result.current.id).toBe("2");
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
    expect(result.current.id).toBe("4");
    expect(result.next).toBeNull();
    expect(result.progress).toBe(100);
    expect(result.pointsToNext).toBe(0);
    expect(result.roadPosition).toBe(100);
  });

  it("supports an extra package with an arbitrary API id", () => {
    const extra = tier("73", "Platinum", 30000);
    const result = overview(32000, [extra, ...tiers]);
    expect(result.current).toEqual(extra);
    expect(result.tiers).toHaveLength(5);
    expect(result.next).toBeNull();
    expect(result.roadPosition).toBe(100);
  });
});

describe("rewardsHomeOverview", () => {
  it("uses E7's current package and sorts its road list", () => {
    const result = rewardsHomeOverview({
      tierPoints: 0,
      balance: 0,
      currentTier: tiers[1],
      roadTiers: [tiers[2], tiers[1], tiers[0]],
    });
    expect(result.tiers.map(({ tier, state }) => [tier.id, state])).toEqual([
      ["1", "reached"],
      ["2", "current"],
      ["3", "locked"],
    ]);
    expect(result.current.id).toBe("2");
    expect(result.next?.id).toBe("3");
  });
});
