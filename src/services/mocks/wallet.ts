import { MAX_TOP_UP, type WalletSummary, type WalletTransaction } from '@/features/wallet/model';
import { AppError } from '@/shared/lib/errors';
import { bankAccountsApi } from '../bankAccounts.api';
import type { WalletApi } from '../wallet.api';

export const MOCK_WALLET_SUMMARY: WalletSummary = {
  total: 2500,
  withdrawable: 1500,
  nonWithdrawable: 1000,
};

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'topup', status: 'success', amount: 2500, accountId: null, reference: '7A3D6D', createdAt: '2025-12-01T04:50:00' },
  { id: '2', type: 'refund', status: 'success', amount: 2500, accountId: null, reference: '7A3D6E', createdAt: '2025-12-01T04:50:00' },
  { id: '3', type: 'payment', status: 'success', amount: 2500, accountId: null, reference: '7A3D6F', createdAt: '2025-12-01T04:50:00' },
  { id: '4', type: 'withdrawal', status: 'success', amount: 2500, accountId: 'bank-1', reference: '7A3D70', createdAt: '2025-12-01T04:50:00' },
];

// In-memory state, so this mock must only run in the browser: on the server it
// would be shared between every user of the process.
let summary: WalletSummary = { ...MOCK_WALLET_SUMMARY };
let transactions: WalletTransaction[] = [...MOCK_WALLET_TRANSACTIONS];

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

const randomReference = () =>
  Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');

function record(type: WalletTransaction['type'], amount: number, accountId: string | null = null) {
  transactions = [
    {
      id: `${Date.now()}-${transactions.length}`,
      type,
      status: 'success',
      amount,
      accountId,
      reference: randomReference(),
      createdAt: new Date().toISOString(),
    },
    ...transactions,
  ];
}

/** Mock failure rule: top-ups above MAX_TOP_UP are rejected. */
export const walletMock: WalletApi = {
  async getWallet() {
    await delay(300);
    return { summary: { ...summary }, transactions: [...transactions] };
  },

  getBankAccounts() {
    return bankAccountsApi.getBankAccounts();
  },

  async topUp(amount) {
    await delay();
    if (amount > MAX_TOP_UP) throw new AppError('conflict', 'wallet.topUpRejected');

    summary = {
      ...summary,
      total: summary.total + amount,
      withdrawable: summary.withdrawable + amount,
    };
    record('topup', amount);
  },

  async withdraw({ bankAccountId, amount }) {
    const accounts = await bankAccountsApi.getBankAccounts();
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
    record('withdrawal', amount, bankAccountId);
  },
};
