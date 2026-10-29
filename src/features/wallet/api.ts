import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { AppError } from "@/shared/lib/errors";
import type {
  WalletData,
  WalletTransactionStatus,
  WalletTransactionType,
} from "./model";

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
    transactions: value.data.transactions.map((transaction) => ({
      id: String(transaction.id),
      type: transaction.type,
      status: transaction.status,
      amount: transaction.value,
      accountId:
        transaction.account_id === null ? null : String(transaction.account_id),
      // GET /wallet has no reference field; use its transaction ID for now.
      reference: String(transaction.id),
      createdAt: transaction.created_at,
    })),
  };
}
