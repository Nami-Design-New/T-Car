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
export interface WalletTopUpPayment {
  paymentUrl: string;
  successUrl: string;
  failUrl: string;
}

export type WalletTopUpOutcome = 'success' | 'failed';

/**
 * The backend's success and fail pages post these strings to `window.opener`
 * (wallet-api.md §3.4); the opener closes the payment tab.
 */
const TOP_UP_MESSAGES: Record<string, WalletTopUpOutcome> = {
  'payment-success': 'success',
  'payment-failed': 'failed',
};

/** The outcome a payment page reports, or null for any other message. */
export function topUpOutcome(data: unknown): WalletTopUpOutcome | null {
  return typeof data === 'string' && Object.hasOwn(TOP_UP_MESSAGES, data)
    ? TOP_UP_MESSAGES[data]
    : null;
}

export interface WithdrawParams {
  bankAccountId: string;
  amount: number;
}

export const MIN_TOP_UP = 10;
/** Current mock contract; the real service owns this limit when integrated. */
export const MAX_TOP_UP = 10000;
export const MIN_WITHDRAW = 10;
