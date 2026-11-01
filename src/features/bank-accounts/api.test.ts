import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get },
}));

import { bankAccountsApi, mapBankAccountsResponse } from "./api";

const response = {
  data: [
    {
      id: 5,
      bank_id: 2,
      title: "Al Rajhi Bank",
      logo: "https://t-car.app/storage/banks/rajhi.png",
      iban_number: "sa44 2000 0001 2345 6712 3456",
    },
    {
      id: 6,
      bank_id: 3,
      title: "Riyad Bank",
      logo: null,
      iban_number: "SA1515000000000000987654",
    },
  ],
  message: "Bank accounts fetched successfully.",
  code: 200,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 2,
    from: 1,
    to: 2,
  },
};

beforeEach(() => vi.clearAllMocks());

describe("bank accounts response mapping", () => {
  it("maps IDs to strings, title to bank name, and masks the IBAN", () => {
    expect(mapBankAccountsResponse(response).items).toEqual([
      {
        id: "5",
        bankId: "2",
        bankName: "Al Rajhi Bank",
        logo: "https://t-car.app/storage/banks/rajhi.png",
        iban: "SA4420000001234567123456",
        maskedNumber: "12 34 56",
      },
      {
        id: "6",
        bankId: "3",
        bankName: "Riyad Bank",
        logo: undefined,
        iban: "SA1515000000000000987654",
        maskedNumber: "98 76 54",
      },
    ]);
  });

  it("maps the pagination block into the page", () => {
    expect(mapBankAccountsResponse(response)).toMatchObject({
      page: 1,
      lastPage: 1,
      total: 2,
    });
  });

  it("drops a logo that is not an absolute http(s) URL", () => {
    const {
      items: [account],
    } = mapBankAccountsResponse({
      ...response,
      data: [{ ...response.data[0], logo: "banks/rajhi.png" }],
    });
    expect(account.logo).toBeUndefined();
  });

  it("throws a server AppError for malformed accounts or envelopes", () => {
    for (const value of [
      { ...response, data: null },
      { ...response, data: [{ ...response.data[0], id: "5" }] },
      { ...response, data: [{ ...response.data[0], title: undefined }] },
      { ...response, code: 422 },
      { ...response, pagination: undefined },
    ]) {
      expect(() => mapBankAccountsResponse(value)).toThrow(
        new AppError("server"),
      );
    }
  });
});

describe("bankAccountsApi.getBankAccounts", () => {
  it("reads the requested page of the authenticated endpoint", async () => {
    get.mockResolvedValue(response);

    await expect(bankAccountsApi.getBankAccounts(2)).resolves.toMatchObject({
      items: [{ id: "5" }, { id: "6" }],
    });
    expect(get).toHaveBeenCalledWith("/bank-accounts", {
      query: { page: 2, per_page: 10 },
    });
  });

  it("preserves HTTP errors from the shared authenticated client", async () => {
    const unauthorized = new AppError("unauthorized", undefined, 401);
    get.mockRejectedValue(unauthorized);

    await expect(bankAccountsApi.getBankAccounts(1)).rejects.toBe(unauthorized);
  });
});
