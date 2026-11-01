import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BankAccount } from "@/features/bank-accounts";
import { AppError } from "@/shared/lib/errors";
import type { WalletData } from "./model";

const { auth, topUp } = vi.hoisted(() => ({
  auth: vi.fn(),
  topUp: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("./api", () => ({ walletApi: { topUp } }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { topUpAction, withdrawAction } from "./actions";

const wallet: WalletData = {
  summary: { total: 100, withdrawable: 50, nonWithdrawable: 50 },
  transactions: [],
};

const account: BankAccount = {
  id: "bank-1",
  bankId: "alrajhi",
  bankName: "Al Rajhi Bank",
  iban: "SA0000000000000000000000",
  maskedNumber: "00 0000",
};

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
  it("rejects an amount beyond the current withdrawable balance", async () => {
    await expect(
      withdrawAction({ bankAccountId: account.id, amount: 51 }, wallet, [
        account,
      ]),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "wallet.amountTooHigh",
        fieldErrors: { amount: "wallet.amountTooHigh" },
      },
    });
  });

  it("keeps bank-account ownership as an action check", async () => {
    await expect(
      withdrawAction({ bankAccountId: "other", amount: 10 }, wallet, [account]),
    ).resolves.toEqual({
      ok: false,
      error: { kind: "not_found", code: "bankAccounts.notFound" },
    });
  });
});
