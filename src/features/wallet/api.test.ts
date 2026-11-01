import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get, post },
}));

import { isWalletResponse, mapWalletResponse, walletApi } from "./api";

const response = {
  data: {
    transactions: [
      {
        id: 14,
        value: 10,
        type: "withdrawal",
        account_id: 5,
        status: "pending",
        created_at: "2026-10-28 07:05:30",
      },
      {
        id: 13,
        value: 100000,
        type: "topup",
        account_id: null,
        status: "success",
        created_at: "2026-10-28 07:04:44",
      },
    ],
    balance: 100000,
    withdrawable_balance: 100000,
    non_withdrawable_balance: 0,
  },
  message: "Transactions fetched successfully.",
  code: 200,
};

describe("wallet API response mapping", () => {
  it("maps the observed wallet response and gets summary values from /wallet", () => {
    expect(isWalletResponse(response)).toBe(true);
    expect(mapWalletResponse(response)).toEqual({
      summary: { total: 100000, withdrawable: 100000, nonWithdrawable: 0 },
      transactions: [
        {
          id: "14",
          type: "withdrawal",
          status: "pending",
          amount: 10,
          accountId: "5",
          reference: "14",
          createdAt: "2026-10-28 07:05:30",
        },
        {
          id: "13",
          type: "topup",
          status: "success",
          amount: 100000,
          accountId: null,
          reference: "13",
          createdAt: "2026-10-28 07:04:44",
        },
      ],
    });
  });

  it("accepts every agreed transaction type and status", () => {
    const types = ["refund", "payment", "topup", "withdrawal"] as const;
    const statuses = ["pending", "success", "failed"] as const;

    for (const type of types) {
      for (const status of statuses) {
        expect(
          isWalletResponse({
            ...response,
            data: {
              ...response.data,
              transactions: [
                { ...response.data.transactions[0], type, status },
              ],
            },
          }),
        ).toBe(true);
      }
    }
  });

  it("rejects unknown transaction types and statuses", () => {
    expect(
      isWalletResponse({
        ...response,
        data: {
          ...response.data,
          transactions: [
            { ...response.data.transactions[0], type: "withdraw" },
          ],
        },
      }),
    ).toBe(false);
    expect(
      isWalletResponse({
        ...response,
        data: {
          ...response.data,
          transactions: [
            { ...response.data.transactions[0], status: "processing" },
          ],
        },
      }),
    ).toBe(false);
  });

  it("rejects malformed amounts, missing fields, and non-success envelopes", () => {
    expect(
      isWalletResponse({
        ...response,
        data: { ...response.data, balance: Number.NaN },
      }),
    ).toBe(false);
    expect(
      isWalletResponse({
        ...response,
        data: { ...response.data, transactions: [{ id: 1 }] },
      }),
    ).toBe(false);
    expect(isWalletResponse({ ...response, code: 422 })).toBe(false);
  });

  it("throws a server AppError for an invalid response", () => {
    expect(() => mapWalletResponse({ ...response, data: null })).toThrow(
      new AppError("server"),
    );
  });
});

describe("walletApi.getWallet", () => {
  it("fetches the authenticated wallet endpoint and maps its response", async () => {
    get.mockResolvedValue(response);

    await expect(walletApi.getWallet()).resolves.toEqual(
      mapWalletResponse(response),
    );
    expect(get).toHaveBeenCalledWith("/wallet");
  });

  it("rejects malformed successful responses", async () => {
    get.mockResolvedValue({ ...response, data: null });

    await expect(walletApi.getWallet()).rejects.toEqual(new AppError("server"));
  });

  it("preserves HTTP errors from the shared authenticated client", async () => {
    const unauthorized = new AppError("unauthorized", undefined, 401);
    get.mockRejectedValue(unauthorized);

    await expect(walletApi.getWallet()).rejects.toBe(unauthorized);
  });
});

describe("walletApi.topUp", () => {
  const topUpResponse = {
    data: {
      payment_url: "https://t-car.app/wallet/pay/75?locale=en",
      success_url: "https://t-car.app/wallet/success/75?locale=en",
      fail_url: "https://t-car.app/wallet/fail/75?locale=en",
    },
    message: "Wallet top-up request created successfully.",
    code: 200,
  };

  it("posts the amount only and maps the observed payment URLs", async () => {
    post.mockResolvedValue(topUpResponse);

    await expect(walletApi.topUp(25)).resolves.toEqual({
      ok: true,
      data: {
        paymentUrl: "https://t-car.app/wallet/pay/75?locale=en",
        successUrl: "https://t-car.app/wallet/success/75?locale=en",
        failUrl: "https://t-car.app/wallet/fail/75?locale=en",
      },
      message: "Wallet top-up request created successfully.",
    });
    expect(post).toHaveBeenCalledWith("/wallet", { amount: 25 });
  });

  it("fails with a server error for missing or non-https payment URLs", async () => {
    for (const data of [
      null,
      { ...topUpResponse.data, fail_url: undefined },
      { ...topUpResponse.data, payment_url: "javascript:alert(1)" },
      { ...topUpResponse.data, payment_url: "http://t-car.app/wallet/pay/75" },
    ]) {
      post.mockResolvedValueOnce({ ...topUpResponse, data });
      await expect(walletApi.topUp(25)).resolves.toEqual({
        ok: false,
        error: new AppError("server"),
      });
    }
  });

  it("returns validation and unauthorized errors from the shared client", async () => {
    for (const error of [
      new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The amount field is required.",
      }),
      new AppError("unauthorized", undefined, 401),
    ]) {
      post.mockRejectedValueOnce(error);
      const result = await walletApi.topUp(25);
      expect(result).toEqual({ ok: false, error });
      if (!result.ok) expect(result.error).toBe(error);
    }
  });
});
