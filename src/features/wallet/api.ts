import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import type {
  WalletData,
  WalletTransaction,
  WalletTransactionStatus,
  WalletTopUpPayment,
  WalletTransactionType,
  WithdrawParams,
} from "./model";

export interface WalletApi {
  getWallet(): Promise<WalletData>;
  topUp(amount: number): Promise<Result<WalletTopUpPayment>>;
  /** Creates a pending withdrawal request and returns its transaction. */
  withdraw(params: WithdrawParams): Promise<Result<WalletTransaction>>;
}

const WALLET_TRANSACTION_TYPES = [
  "refund",
  "payment",
  "topup",
  "withdrawal",
] as const satisfies readonly WalletTransactionType[];

const WALLET_TRANSACTION_STATUSES = [
  "pending",
  "success",
  "failed",
] as const satisfies readonly WalletTransactionStatus[];

interface WalletTransactionDto {
  id: number;
  value: number;
  type: WalletTransactionType;
  account_id: number | null;
  status: WalletTransactionStatus;
  created_at: string;
}

interface WalletResponseDto {
  transactions: WalletTransactionDto[];
  balance: number;
  withdrawable_balance: number;
  non_withdrawable_balance: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isWalletTransactionType = (
  value: unknown,
): value is WalletTransactionType =>
  WALLET_TRANSACTION_TYPES.some((type) => type === value);

const isWalletTransactionStatus = (
  value: unknown,
): value is WalletTransactionStatus =>
  WALLET_TRANSACTION_STATUSES.some((status) => status === value);

function isWalletTransactionDto(value: unknown): value is WalletTransactionDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.value === "number" &&
    Number.isFinite(value.value) &&
    isWalletTransactionType(value.type) &&
    (value.account_id === null ||
      (typeof value.account_id === "number" &&
        Number.isInteger(value.account_id))) &&
    isWalletTransactionStatus(value.status) &&
    typeof value.created_at === "string"
  );
}

function isWalletResponseDto(value: unknown): value is WalletResponseDto {
  return (
    isRecord(value) &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isWalletTransactionDto) &&
    typeof value.balance === "number" &&
    Number.isFinite(value.balance) &&
    typeof value.withdrawable_balance === "number" &&
    Number.isFinite(value.withdrawable_balance) &&
    typeof value.non_withdrawable_balance === "number" &&
    Number.isFinite(value.non_withdrawable_balance)
  );
}

export function isWalletResponse(
  value: unknown,
): value is ApiEnvelope<WalletResponseDto> {
  return (
    isApiEnvelope(value) &&
    value.code === 200 &&
    isWalletResponseDto(value.data)
  );
}

/** Validate the current GET /wallet response and map it into the UI model. */
export function mapWalletResponse(value: unknown): WalletData {
  if (!isWalletResponse(value)) throw new AppError("server");

  return {
    summary: {
      total: value.data.balance,
      withdrawable: value.data.withdrawable_balance,
      nonWithdrawable: value.data.non_withdrawable_balance,
    },
    transactions: value.data.transactions.map(toWalletTransaction),
  };
}

function toWalletTransaction(
  transaction: WalletTransactionDto,
): WalletTransaction {
  return {
    id: String(transaction.id),
    type: transaction.type,
    status: transaction.status,
    amount: transaction.value,
    accountId:
      transaction.account_id === null ? null : String(transaction.account_id),
    // The API has no reference field; use the transaction ID for now.
    reference: String(transaction.id),
    createdAt: transaction.created_at,
  };
}

async function getWallet(): Promise<WalletData> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/wallet");
  return mapWalletResponse(response);
}

interface WalletTopUpDto {
  payment_url: string;
  success_url: string;
  fail_url: string;
}

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

function isWalletTopUpDto(value: unknown): value is WalletTopUpDto {
  return (
    isRecord(value) &&
    isHttpsUrl(value.payment_url) &&
    isHttpsUrl(value.success_url) &&
    isHttpsUrl(value.fail_url)
  );
}

/**
 * Creates a payment request; the balance changes only after the customer pays
 * at `paymentUrl`. Bruno also sends `account_id`; top-up omits it until the
 * backend confirms it is withdrawal-only (wallet-api.md §2).
 */
async function topUp(amount: number): Promise<Result<WalletTopUpPayment>> {
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>("/wallet", {
      amount,
    });
    if (!isApiEnvelope(response) || !isWalletTopUpDto(response.data)) {
      throw new AppError("server");
    }
    return ok(
      {
        paymentUrl: response.data.payment_url,
        successUrl: response.data.success_url,
        failUrl: response.data.fail_url,
      },
      response.message,
    );
  } catch (error) {
    return fail(error);
  }
}

/**
 * Sends the amount to the chosen account. Success returns the new
 * transaction (status `pending` until the backend pays it out); the balance
 * is re-read from GET /wallet rather than adjusted here.
 */
async function withdraw({
  bankAccountId,
  amount,
}: WithdrawParams): Promise<Result<WalletTransaction>> {
  try {
    const accountId = Number(bankAccountId);
    // Account IDs come from GET /bank-accounts as numbers.
    if (!Number.isSafeInteger(accountId) || accountId < 1) {
      throw new AppError("validation", "wallet.bankAccountRequired");
    }
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/wallet/withdraw",
      { amount, account_id: accountId },
    );
    if (!isApiEnvelope(response) || !isWalletTransactionDto(response.data)) {
      throw new AppError("server");
    }
    return ok(toWalletTransaction(response.data), response.message);
  } catch (error) {
    return fail(error);
  }
}

/** The authenticated wallet read, top-up, and withdrawal. */
export const walletApi: WalletApi = {
  getWallet,
  topUp,
  withdraw,
};
