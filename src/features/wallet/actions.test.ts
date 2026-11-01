import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { auth, topUp, withdraw } = vi.hoisted(() => ({
  auth: vi.fn(),
  topUp: vi.fn(),
  withdraw: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("./api", () => ({ walletApi: { topUp, withdraw } }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { topUpAction, withdrawAction } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
});

describe("topUpAction", () => {
  it("requires a session before validating a top-up", async () => {
    auth.mockResolvedValue(null);
    await expect(topUpAction(0)).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(topUp).not.toHaveBeenCalled();
  });

  it("rejects malformed amounts without calling the API", async () => {
    await expect(topUpAction(9)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "wallet.amountTooLow",
        fieldErrors: { amount: "wallet.amountTooLow" },
      },
    });
  });

  it("sends the parsed amount and returns the payment and message", async () => {
    const payment = {
      paymentUrl: "https://t-car.app/wallet/pay/75",
      successUrl: "https://t-car.app/wallet/success/75",
      failUrl: "https://t-car.app/wallet/fail/75",
    };
    topUp.mockResolvedValue({ ok: true, data: payment, message: "Created." });

    await expect(topUpAction(25)).resolves.toEqual({
      ok: true,
      data: payment,
      message: "Created.",
    });
    expect(topUp).toHaveBeenCalledWith(25);
  });

  it("carries the backend validation message across the boundary", async () => {
    topUp.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The amount field is required.",
      }),
    });

    await expect(topUpAction(25)).resolves.toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        serverMessage: "The amount field is required.",
      },
    });
  });
});

describe("withdrawAction", () => {
  const transaction = {
    id: "84",
    type: "withdrawal",
    status: "pending",
    amount: 10,
    accountId: "5",
    reference: "84",
    createdAt: "2026-11-01 13:12:58",
  };

  it("requires a session before calling the API", async () => {
    auth.mockResolvedValue(null);
    await expect(
      withdrawAction({ bankAccountId: "5", amount: 10 }),
    ).resolves.toEqual({ ok: false, error: { kind: "unauthorized" } });
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("rejects a malformed amount or a missing account without calling the API", async () => {
    await expect(
      withdrawAction({ bankAccountId: "5", amount: 9 }),
    ).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", fieldErrors: { amount: "wallet.amountTooLow" } },
    });
    await expect(
      withdrawAction({ bankAccountId: "", amount: 10 }),
    ).resolves.toMatchObject({ ok: false, error: { kind: "validation" } });
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("leaves the balance check to the API", async () => {
    withdraw.mockResolvedValue({ ok: true, data: transaction, message: "Created." });

    await expect(
      withdrawAction({ bankAccountId: "5", amount: 1_000_000 }),
    ).resolves.toEqual({ ok: true, data: transaction, message: "Created." });
    expect(withdraw).toHaveBeenCalledWith({ bankAccountId: "5", amount: 1_000_000 });
  });

  it("carries the backend validation message across the boundary", async () => {
    withdraw.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "Insufficient balance.",
      }),
    });

    await expect(
      withdrawAction({ bankAccountId: "5", amount: 10 }),
    ).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", serverMessage: "Insufficient balance." },
    });
  });
});
