import {
  maskIban,
  normalizeIban,
  type Bank,
  type BankAccount,
  type BankAccountPayload,
} from '@/features/bank-accounts/model';
import { AppError } from '@/shared/lib/errors';
import type { BankAccountsApi } from '../bankAccounts.api';
import sedadBankLogo from '@assets/images/banks/sedad-bank.png';

export const MOCK_BANKS: Bank[] = [
  { id: 'sedad', name: 'بنك السداد', logo: sedadBankLogo },
  { id: 'alahli', name: 'البنك الأهلي' },
  { id: 'alrajhi', name: 'مصرف الراجحي' },
  { id: 'riyad', name: 'بنك الرياض' },
];

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    bankId: 'sedad',
    bankName: 'بنك السداد',
    logo: sedadBankLogo,
    iban: 'SA0380000000608010456789',
    maskedNumber: '45 67 89',
  },
  {
    id: '2',
    bankId: 'alrajhi',
    bankName: 'مصرف الراجحي',
    iban: 'SA4420000001234567123456',
    maskedNumber: '12 34 56',
  },
  {
    id: '3',
    bankId: 'riyad',
    bankName: 'بنك الرياض',
    iban: 'SA1515000000000000987654',
    maskedNumber: '98 76 54',
  },
];

// In-memory state, so this mock must only run in the browser: on the server it
// would be shared between every user of the process.
let accounts: BankAccount[] = [...MOCK_BANK_ACCOUNTS];

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const bankAccountsMock: BankAccountsApi = {
  async getBanks() {
    await delay(300);
    return [...MOCK_BANKS];
  },

  async getBankAccounts() {
    await delay(300);
    return [...accounts];
  },

  async addBankAccount(payload) {
    await delay();
    accounts = [...accounts, toAccount(`${Date.now()}`, payload)];
  },

  async updateBankAccount(id, payload) {
    await delay();
    if (!accounts.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }

    accounts = accounts.map((account) => (account.id === id ? toAccount(id, payload) : account));
  },

  async deleteBankAccount(id) {
    await delay();
    if (!accounts.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }

    accounts = accounts.filter((account) => account.id !== id);
  },
};
