export type WalletTransactionType = 'topup' | 'refund' | 'payment' | 'withdraw';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
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
export const MIN_WITHDRAW = 10;
