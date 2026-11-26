import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { fail, ok } from "@/shared/lib/result";
import { getRewardCardsPageAction, redeemRewardAction } from "./actions";

const { authMock, redeemMock, cardsPageMock, reportErrorMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    redeemMock: vi.fn(),
    cardsPageMock: vi.fn(),
    reportErrorMock: vi.fn(),
  }),
);

vi.mock("@/shared/lib/report", () => ({ reportError: reportErrorMock }));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./api", () => ({
  rewardsApi: { redeem: redeemMock, getCardsPage: cardsPageMock },
}));

describe("getRewardCardsPageAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    cardsPageMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "customer-1" } });
  });

  it("loads the selected E10 page and serializes the result", async () => {
    const page = { items: [], page: 2, lastPage: 2, total: 10 };
    cardsPageMock.mockResolvedValue(page);
    await expect(getRewardCardsPageAction(2, "used")).resolves.toEqual({
      ok: true,
      data: page,
    });
    expect(cardsPageMock).toHaveBeenCalledWith("customer-1", 2, "used");
  });

  it("rejects invalid page/filter and a missing session", async () => {
    await expect(getRewardCardsPageAction(0, "all")).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation" },
    });
    await expect(
      getRewardCardsPageAction(1, "wrong" as never),
    ).resolves.toMatchObject({ ok: false, error: { kind: "validation" } });
    authMock.mockResolvedValue(null);
    await expect(getRewardCardsPageAction(1, "all")).resolves.toMatchObject({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(cardsPageMock).not.toHaveBeenCalled();
  });
});

describe("redeemRewardAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    redeemMock.mockReset();
    reportErrorMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "customer-1" } });
  });

  it("passes only the card id and authenticated user to the service", async () => {
    const receipt = {
      card: {
        id: "redeemed-50",
        code: "TCAR-30S-Q9LD",
        discountAmount: 50,
        status: "active" as const,
      },
      pointsCost: 1000,
      balanceBefore: 4000,
      balanceAfter: 3000,
      tierPoints: 12000,
      tierId: "3",
      tierName: "Gold",
    };
    redeemMock.mockResolvedValue(ok(receipt));

    const result = await redeemRewardAction("discount-50");

    expect(redeemMock).toHaveBeenCalledWith("customer-1", "discount-50");
    expect(result).toEqual({ ok: true, data: receipt });
  });

  it("rejects a missing session before calling the service", async () => {
    authMock.mockResolvedValue(null);

    const result = await redeemRewardAction("discount-50");

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(redeemMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid id before calling the service", async () => {
    const result = await redeemRewardAction("");

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "validation", code: "rewards.cardUnavailable" },
    });
    expect(redeemMock).not.toHaveBeenCalled();
  });

  it("serializes service failures without an AppError instance", async () => {
    redeemMock.mockResolvedValue(
      fail(new AppError("conflict", "rewards.insufficientPoints")),
    );

    const result = await redeemRewardAction("discount-200");

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "conflict", code: "rewards.insufficientPoints" },
    });
    if (!result.ok) expect(result.error).not.toBeInstanceOf(AppError);
  });

  it("maps a rejected service call to a plain error and reports it", async () => {
    redeemMock.mockRejectedValueOnce(
      new AppError("network", "rewards.unavailable"),
    );

    const network = await redeemRewardAction("discount-50");

    expect(network).toMatchObject({
      ok: false,
      error: { kind: "network", code: "rewards.unavailable" },
    });
    if (!network.ok) expect(network.error).not.toBeInstanceOf(AppError);
    expect(reportErrorMock).toHaveBeenCalledWith(expect.any(AppError), {
      scope: "rewards.redeem",
    });

    redeemMock.mockRejectedValueOnce(new Error("boom"));

    expect(await redeemRewardAction("discount-50")).toMatchObject({
      ok: false,
      error: { kind: "unknown" },
    });
    expect(reportErrorMock).toHaveBeenCalledTimes(2);
  });
});
