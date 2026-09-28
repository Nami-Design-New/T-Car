import type { BankAccount, WalletSummary, WalletTransaction } from '@app-types/car';
import {
  MOCK_BANK_ACCOUNTS,
  MOCK_WALLET_SUMMARY,
  MOCK_WALLET_TRANSACTIONS,
} from '@/data/wallet';

export interface WalletData {
  summary: WalletSummary;
  transactions: WalletTransaction[];
}

export interface WithdrawParams {
  bankAccountId: string;
  amount: number;
}

// The wallet endpoints are not available yet, so the service works on an
// in-memory copy of the mock data. Swap each method body for an `api` call
// (see cars.service.ts) once the backend is ready; callers stay unchanged.
let summary: WalletSummary = { ...MOCK_WALLET_SUMMARY };
let transactions: WalletTransaction[] = [...MOCK_WALLET_TRANSACTIONS];

/** Mock only: top-ups above this fail, so the failure state can be exercised. */
const MOCK_MAX_TOP_UP = 10000;

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

const randomReference = () =>
  Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');

function record(type: WalletTransaction['type'], amount: number) {
  transactions = [
    {
      id: `${Date.now()}-${transactions.length}`,
      type,
      amount,
      reference: randomReference(),
      createdAt: new Date().toISOString(),
    },
    ...transactions,
  ];
}

export const walletService = {
  async getWallet(): Promise<WalletData> {
    await delay(300);
    return { summary: { ...summary }, transactions: [...transactions] };
  },

  async getBankAccounts(): Promise<BankAccount[]> {
    await delay(300);
    return [...MOCK_BANK_ACCOUNTS];
  },

  async topUp(amount: number): Promise<void> {
    await delay();
    if (amount > MOCK_MAX_TOP_UP) throw new Error('Top-up rejected');

    summary = {
      ...summary,
      total: summary.total + amount,
      withdrawable: summary.withdrawable + amount,
    };
    record('topup', amount);
  },

  async withdraw({ bankAccountId, amount }: WithdrawParams): Promise<void> {
    await delay();
    const accountExists = MOCK_BANK_ACCOUNTS.some((account) => account.id === bankAccountId);
    if (!accountExists || amount > summary.withdrawable) throw new Error('Withdraw rejected');

    summary = {
      ...summary,
      total: summary.total - amount,
      withdrawable: summary.withdrawable - amount,
    };
    record('withdraw', amount);
  },
};
