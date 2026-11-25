import { beforeEach, describe, expect, it, vi } from "vitest";
import TierDetailRoute from "./page";

const { getRewardsSummaryMock, notFoundMock } = vi.hoisted(() => ({
  getRewardsSummaryMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/features/rewards", () => ({ TierDetailPage: () => null }));
vi.mock("@/features/rewards/queries", () => ({
  getRewardsSummary: getRewardsSummaryMock,
}));

describe("reward tier detail route", () => {
  beforeEach(() => {
    getRewardsSummaryMock.mockReset();
    notFoundMock.mockClear();
    getRewardsSummaryMock.mockResolvedValue({ tiers: [{ id: "73" }] });
  });

  it("accepts an arbitrary package id present in the data", async () => {
    const page = await TierDetailRoute({
      params: Promise.resolve({ id: "73" }),
    });
    expect(page.props.tierId).toBe("73");
  });

  it("returns NEXT_NOT_FOUND for an unknown package id", async () => {
    await expect(
      TierDetailRoute({ params: Promise.resolve({ id: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
