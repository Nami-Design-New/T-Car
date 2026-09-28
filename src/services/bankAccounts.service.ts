import type { Bank, BankAccount, BankAccountPayload } from '@app-types/car';
import { MOCK_BANKS, MOCK_BANK_ACCOUNTS } from './mocks/wallet';
import { AppError } from '@/shared/lib/errors';

// The bank account endpoints are not available yet, so the service works on an
// in-memory copy of the mock data. Swap each method body for an `api` call
// (see cars.api.ts) once the backend is ready; callers stay unchanged.
let accounts: BankAccount[] = [...MOCK_BANK_ACCOUNTS];

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

/** Upper-cases the IBAN and drops any spaces the user typed. */
export const normalizeIban = (iban: string) => iban.replace(/\s+/g, '').toUpperCase();

/** Last six IBAN characters in pairs, e.g. "…456789" → "45 67 89". */
export const maskIban = (iban: string) =>
  normalizeIban(iban)
    .slice(-6)
    .match(/.{1,2}/g)
    ?.join(' ') ?? '';

function toAccount(id: string, { bankId, iban }: BankAccountPayload): BankAccount {
  const bank = MOCK_BANKS.find((item) => item.id === bankId);
  if (!bank) {
    throw new AppError('validation', 'bankAccounts.unknownBank', undefined, {
      bankId: 'bankAccounts.unknownBank',
    });
  }

  const normalized = normalizeIban(iban);
  if (!normalized) {
    throw new AppError('validation', 'bankAccounts.ibanRequired', undefined, {
      iban: 'bankAccounts.ibanRequired',
    });
  }

  return {
    id,
    bankId: bank.id,
    bankName: bank.name,
    logo: bank.logo,
    iban: normalized,
    maskedNumber: maskIban(normalized),
  };
}

export const bankAccountsService = {
  async getBanks(): Promise<Bank[]> {
    await delay(300);
    return [...MOCK_BANKS];
  },

  async getBankAccounts(): Promise<BankAccount[]> {
    await delay(300);
    return [...accounts];
  },

  async addBankAccount(payload: BankAccountPayload): Promise<void> {
    await delay();
    accounts = [...accounts, toAccount(`${Date.now()}`, payload)];
  },

  async updateBankAccount(id: string, payload: BankAccountPayload): Promise<void> {
    await delay();
    if (!accounts.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }

    accounts = accounts.map((account) => (account.id === id ? toAccount(id, payload) : account));
  },

  async deleteBankAccount(id: string): Promise<void> {
    await delay();
    if (!accounts.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }

    accounts = accounts.filter((account) => account.id !== id);
  },
};
