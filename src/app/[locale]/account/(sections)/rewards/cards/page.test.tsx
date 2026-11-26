import { beforeEach, describe, expect, it, vi } from "vitest";
import RewardCardsRoute from "./page";

const { getRewardCardsMock } = vi.hoisted(() => ({
  getRewardCardsMock: vi.fn(),
}));

vi.mock("@/features/rewards/queries", () => ({
  getRewardCards: getRewardCardsMock,
}));

describe("My Cards route", () => {
  beforeEach(() => {
    getRewardCardsMock.mockReset();
    getRewardCardsMock.mockResolvedValue({
      balance: 0,
      page: { items: [], page: 1, lastPage: 1, total: 0 },
    });
  });

  it("passes the selected backend filter to the query and page", async () => {
    const page = await RewardCardsRoute({
      searchParams: Promise.resolve({ filter: "used" }),
    });
    expect(getRewardCardsMock).toHaveBeenCalledWith("used");
    expect(page.props.filter).toBe("used");
    expect(page.key).toBe("used");
  });

  it("uses all when the URL filter is invalid", async () => {
    const page = await RewardCardsRoute({
      searchParams: Promise.resolve({ filter: "other" }),
    });
    expect(getRewardCardsMock).toHaveBeenCalledWith("all");
    expect(page.props.filter).toBe("all");
  });
});
