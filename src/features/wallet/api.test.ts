import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { isWalletResponse, mapWalletResponse } from "./api";

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
