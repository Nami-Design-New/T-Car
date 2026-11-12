import type { PaymentLinks, PaymentOutcome } from '@/shared/lib/paymentWindow';

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

/** A created top-up: the customer pays at `paymentUrl`; the balance changes after payment. */
export type WalletTopUpPayment = PaymentLinks;

export type WalletTopUpOutcome = PaymentOutcome;

export interface WithdrawParams {
  bankAccountId: string;
  amount: number;
}

export const MIN_TOP_UP = 10;
/** Product top-up limit (SAR), confirmed 2026-11-01; the API also enforces it. */
export const MAX_TOP_UP = 100000;
export const MIN_WITHDRAW = 10;
