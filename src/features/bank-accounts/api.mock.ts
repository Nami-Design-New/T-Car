import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok } from "@/shared/lib/result";
import {
  BANK_ACCOUNTS_PER_PAGE,
  BANKS_PER_PAGE,
  type BankAccountsApi,
} from "./api";
import { maskIban, normalizeIban, type Bank, type BankAccount } from "./model";

/*
 * Test double of the live `BankAccountsApi` (no production caller, no mock
 * flag). Stateless: a write answers as the API does but changes nothing, so it
 * is safe on the server, where module state would be shared between users.
 *
 * Failure rules, as the API answers them:
 * - a bank ID that is not in MOCK_BANKS is a 422 "The selected bank does not
 *   exist." (add and edit);
 * - an account ID that is not in MOCK_BANK_ACCOUNTS is `not_found` with
 *   `bankAccounts.notFound` (edit and delete).
 */

const sedadBankLogo = "/mock/banks/sedad-bank.png";

export const MOCK_BANKS: Bank[] = [
  { id: "1", name: "بنك السداد", logo: sedadBankLogo },
  { id: "2", name: "بنك البلاد" },
  { id: "3", name: "بنك الرياض" },
  { id: "7", name: "مصرف الراجحي" },
];

const account = (id: string, bank: Bank, iban: string): BankAccount => ({
  id,
  bankId: bank.id,
  bankName: bank.name,
  logo: bank.logo,
  iban,
  maskedNumber: maskIban(iban),
});

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  account("5", MOCK_BANKS[0], "SA0380000000608010456789"),
  account("6", MOCK_BANKS[3], "SA4420000001234567123456"),
  account("8", MOCK_BANKS[2], "SA1515000000000000987654"),
];

function toPage<T>(items: T[], page: number, perPage: number): Page<T> {
  const lastPage = Math.max(1, Math.ceil(items.length / perPage));
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page,
    lastPage,
    total: items.length,
  };
}

function toAccount(id: string, bankId: string, iban: string): BankAccount {
  const bank = MOCK_BANKS.find((item) => item.id === bankId);
  if (!bank) {
    throw new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The selected bank does not exist.",
    });
  }
  return account(id, bank, normalizeIban(iban));
}

function requireAccount(id: string): void {
  if (!MOCK_BANK_ACCOUNTS.some((item) => item.id === id)) {
    throw new AppError("not_found", "bankAccounts.notFound", 404);
  }
}

export const bankAccountsMock: BankAccountsApi = {
  async getBankAccounts(page) {
    return toPage(MOCK_BANK_ACCOUNTS, page, BANK_ACCOUNTS_PER_PAGE);
  },

  async getBanks({ page, search }) {
    const term = search?.trim().toLowerCase();
    const banks = term
      ? MOCK_BANKS.filter((bank) => bank.name.toLowerCase().includes(term))
      : MOCK_BANKS;
    return toPage(banks, page, BANKS_PER_PAGE);
  },

  async addBankAccount({ bankId, iban }) {
    try {
      return ok(
        toAccount("100", bankId, iban),
        "Bank account added successfully.",
      );
    } catch (error) {
      return fail(error);
    }
  },

  async updateBankAccount(id, { bankId, iban }) {
    try {
      requireAccount(id);
      return ok(
        toAccount(id, bankId, iban),
        "Bank account updated successfully.",
      );
    } catch (error) {
      return fail(error);
    }
  },

  async deleteBankAccount(id) {
    try {
      requireAccount(id);
      return ok(null, "Bank account deleted successfully.");
    } catch (error) {
      return fail(error);
    }
  },
};
