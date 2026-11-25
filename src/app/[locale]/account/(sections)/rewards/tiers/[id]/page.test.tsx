import { beforeEach, describe, expect, it, vi } from "vitest";
import TierDetailRoute from "./page";

const { getRewardTierMock, getRewardsSummaryMock, notFoundMock } = vi.hoisted(() => ({
  getRewardTierMock: vi.fn(),
  getRewardsSummaryMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/features/rewards", () => ({ TierDetailPage: () => null }));
vi.mock("@/features/rewards/queries", () => ({
  getRewardTier: getRewardTierMock,
  getRewardsSummary: getRewardsSummaryMock,
}));

describe("reward tier detail route", () => {
  beforeEach(() => {
    getRewardTierMock.mockReset();
    getRewardsSummaryMock.mockReset();
    notFoundMock.mockClear();
    getRewardTierMock.mockResolvedValue({ id: "73", name: "Live package" });
    getRewardsSummaryMock.mockResolvedValue({ tiers: [{ id: "73", name: "Old package" }] });
  });

  it("accepts an arbitrary package id present in the data", async () => {
    const page = await TierDetailRoute({
      params: Promise.resolve({ id: "73" }),
    });
    expect(page.props.tierId).toBe("73");
    expect(page.props.summary.tiers[0].name).toBe("Live package");
    expect(getRewardTierMock).toHaveBeenCalledWith("73");
  });

  it("returns NEXT_NOT_FOUND for an unknown package id", async () => {
    getRewardTierMock.mockResolvedValueOnce(null);
    await expect(
      TierDetailRoute({ params: Promise.resolve({ id: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
    expect(getRewardsSummaryMock).not.toHaveBeenCalled();
  });
});
