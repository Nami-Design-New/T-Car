import type { BankAccount, WalletSummary, WalletTransaction } from '@app-types/car';
import { MOCK_WALLET_SUMMARY, MOCK_WALLET_TRANSACTIONS } from './mocks/wallet';
import { bankAccountsService } from '@services/bankAccounts.service';
import { AppError } from '@/shared/lib/errors';

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
// (see cars.api.ts) once the backend is ready; callers stay unchanged.
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

  /** Same accounts the user manages from the bank accounts tab. */
  getBankAccounts(): Promise<BankAccount[]> {
    return bankAccountsService.getBankAccounts();
  },

  async topUp(amount: number): Promise<void> {
    await delay();
    if (amount > MOCK_MAX_TOP_UP) throw new AppError('conflict', 'wallet.topUpRejected');

    summary = {
      ...summary,
      total: summary.total + amount,
      withdrawable: summary.withdrawable + amount,
    };
    record('topup', amount);
  },

  async withdraw({ bankAccountId, amount }: WithdrawParams): Promise<void> {
    const accounts = await bankAccountsService.getBankAccounts();
    await delay();
    if (!accounts.some((account) => account.id === bankAccountId)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }
    if (amount > summary.withdrawable) {
      throw new AppError('conflict', 'wallet.insufficientBalance');
    }

    summary = {
      ...summary,
      total: summary.total - amount,
      withdrawable: summary.withdrawable - amount,
    };
    record('withdraw', amount);
  },
};
