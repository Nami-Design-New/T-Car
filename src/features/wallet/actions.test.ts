import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BankAccount } from "@/features/bank-accounts/model";
import type { WalletData } from "./model";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/auth", () => ({ auth }));
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
    await expect(topUpAction(0, wallet)).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
  });

  it("rejects malformed amounts without changing the wallet", async () => {
    await expect(topUpAction(9, wallet)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "wallet.amountTooLow",
        fieldErrors: { amount: "wallet.amountTooLow" },
      },
    });
  });

  it("uses the parsed amount for a valid top-up", async () => {
    await expect(topUpAction(25, wallet)).resolves.toMatchObject({
      ok: true,
      data: {
        summary: { total: 125, withdrawable: 75 },
        transactions: [{ type: "topup", amount: 25 }],
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
