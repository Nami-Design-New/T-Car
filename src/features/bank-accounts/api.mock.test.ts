import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: {},
  publicServerHttp: {},
}));

import { BANK_ACCOUNTS_PER_PAGE } from "./api";
import { MOCK_BANK_ACCOUNTS, MOCK_BANKS, bankAccountsMock } from "./api.mock";

const payload = { bankId: "2", iban: "sa03 8000 0000 6080 1016 7519" };

describe("bankAccountsMock", () => {
  it("pages the accounts like the API", async () => {
    const page = await bankAccountsMock.getBankAccounts(1);
    expect(page.items).toEqual(
      MOCK_BANK_ACCOUNTS.slice(0, BANK_ACCOUNTS_PER_PAGE),
    );
    expect(page).toMatchObject({ page: 1, total: MOCK_BANK_ACCOUNTS.length });
  });

  it("searches the banks by name", async () => {
    const page = await bankAccountsMock.getBanks({ page: 1, search: "الرياض" });
    expect(page.items).toEqual([MOCK_BANKS[2]]);
  });

  it("answers a write with the account and the backend message, without keeping it", async () => {
    await expect(
      bankAccountsMock.addBankAccount(payload),
    ).resolves.toMatchObject({
      ok: true,
      data: { bankId: "2", iban: "SA0380000000608010167519" },
      message: "Bank account added successfully.",
    });
    expect((await bankAccountsMock.getBankAccounts(1)).total).toBe(
      MOCK_BANK_ACCOUNTS.length,
    );
  });

  it("fails rule 1: an unknown bank is the API's 422", async () => {
    const result = await bankAccountsMock.addBankAccount({
      ...payload,
      bankId: "99",
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The selected bank does not exist.",
      },
    });
  });

  it("fails rule 2: an unknown account is not found on edit and delete", async () => {
    const notFound = {
      ok: false,
      error: { kind: "not_found", code: "bankAccounts.notFound" },
    };
    await expect(
      bankAccountsMock.updateBankAccount("99", payload),
    ).resolves.toMatchObject(notFound);
    await expect(
      bankAccountsMock.deleteBankAccount("99"),
    ).resolves.toMatchObject(notFound);
    await expect(
      bankAccountsMock.deleteBankAccount("5"),
    ).resolves.toMatchObject({
      ok: true,
      message: "Bank account deleted successfully.",
    });
  });
});
