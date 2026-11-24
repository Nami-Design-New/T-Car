import { describe, expect, it } from "vitest";
import { rewardsOverview, type RewardTier } from "./model";

const tiers: RewardTier[] = [
  { id: "bronze", threshold: 1000, perks: [] },
  { id: "silver", threshold: 5000, perks: ["Silver perk"] },
  { id: "gold", threshold: 10000, perks: ["Gold perk"] },
  { id: "diamond", threshold: 20000, perks: ["Diamond perk"] },
];

const overview = (tierPoints: number, list = tiers) =>
  rewardsOverview({ tierPoints, balance: 0, tiers: list });

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
    expect(result.roadPosition).toBeCloseTo(100 / 3);
  });

  it("interpolates the car between equally spaced stops", () => {
    expect(overview(0).roadPosition).toBe(0);
    expect(overview(1000).roadPosition).toBe(0);
    expect(overview(7500).roadPosition).toBe(50);
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
