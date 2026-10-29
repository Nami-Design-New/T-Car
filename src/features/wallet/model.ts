export type WalletTransactionType = 'refund' | 'payment' | 'topup' | 'withdrawal';

export type WalletTransactionStatus = 'pending' | 'success' | 'failed';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  accountId: string | null;
  reference: string;
  /** ISO date string */
  createdAt: string;
}

export interface WalletSummary {
  total: number;
  withdrawable: number;
  nonWithdrawable: number;
}

export interface WalletData {
  summary: WalletSummary;
  transactions: WalletTransaction[];
}

export interface WithdrawParams {
  bankAccountId: string;
  amount: number;
}

export const MIN_TOP_UP = 10;
/** Current mock contract; the real service owns this limit when integrated. */
export const MAX_TOP_UP = 10000;
export const MIN_WITHDRAW = 10;
