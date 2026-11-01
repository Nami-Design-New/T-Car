import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp, serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import {
  maskIban,
  normalizeIban,
  type Bank,
  type BankAccount,
  type BankAccountPayload,
} from "./model";

/** A page of the bank lookup; `search` matches the title in the request locale. */
export interface BanksQuery {
  page: number;
  search?: string;
}

/**
 * The live API: the customer's accounts (the tab and the wallet's bank
 * picker), the bank lookup (the add / edit form), and the writes. Writes
 * return the backend's message for the result dialog.
 */
export interface BankAccountsApi {
  getBankAccounts(page: number): Promise<Page<BankAccount>>;
  getBanks(query: BanksQuery): Promise<Page<Bank>>;
  /** Adds an account (POST /bank-accounts) and returns it. */
  addBankAccount(payload: BankAccountPayload): Promise<Result<BankAccount>>;
  /** Changes an account's bank and IBAN and returns it. */
  updateBankAccount(
    id: string,
    payload: BankAccountPayload,
  ): Promise<Result<BankAccount>>;
  /** Deletes an account (DELETE /bank-accounts/{id}). */
  deleteBankAccount(id: string): Promise<Result<null>>;
}

/**
 * The old mock contract, implemented only by `api.mock.ts`. No production code
 * uses it since the tab reads the API (B3); B7 replaces the mock with one of the
 * live interface for tests (docs/api/bank-accounts-api.md §6).
 */
export interface BankAccountsTabApi {
  getBanks(): Promise<Bank[]>;
  getBankAccounts(): Promise<BankAccount[]>;
  addBankAccount(payload: BankAccountPayload): Promise<void>;
  updateBankAccount(id: string, payload: BankAccountPayload): Promise<void>;
  deleteBankAccount(id: string): Promise<void>;
}

/** Accounts per page; the picker loads the next page on scroll. */
export const BANK_ACCOUNTS_PER_PAGE = 5;

/** Banks per page of the lookup. */
export const BANKS_PER_PAGE = 5;

/** Success is body code 200 or 201 (create answers 201); either is accepted. */
const isSuccessCode = (code: number) => code === 200 || code === 201;

interface BankDto {
  id: number;
  title: string;
  logo: string | null;
}

interface BankAccountDto {
  id: number;
  bank_id: number;
  title: string;
  logo: string | null;
  iban_number: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

function isBankAccountDto(value: unknown): value is BankAccountDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isId(value.bank_id) &&
    typeof value.title === "string" &&
    (value.logo === null || typeof value.logo === "string") &&
    typeof value.iban_number === "string"
  );
}

function isBankDto(value: unknown): value is BankDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    (value.logo === null || typeof value.logo === "string")
  );
}

/** A logo is shown only when it is an absolute http(s) URL. */
function toLogo(logo: string | null): string | undefined {
  if (!logo) return undefined;
  try {
    const { protocol } = new URL(logo);
    return protocol === "https:" || protocol === "http:" ? logo : undefined;
  } catch {
    return undefined;
  }
}

/** Validate one page of GET /bank-accounts and map it into the UI model. */
export function mapBankAccountsResponse(value: unknown): Page<BankAccount> {
  const pagination = isRecord(value) ? value.pagination : undefined;
  if (
    !isApiEnvelope(value) ||
    !isSuccessCode(value.code) ||
    !Array.isArray(value.data) ||
    !value.data.every(isBankAccountDto) ||
    !isPaginationDto(pagination)
  ) {
    throw new AppError("server");
  }

  return toPage(value.data.map(toBankAccount), pagination);
}

function toBankAccount(account: BankAccountDto): BankAccount {
  return {
    id: String(account.id),
    bankId: String(account.bank_id),
    bankName: account.title,
    logo: toLogo(account.logo),
    iban: normalizeIban(account.iban_number),
    maskedNumber: maskIban(account.iban_number),
  };
}

/** The API's IDs are positive integers; the model keeps them as strings. */
function toApiId(id: string): number | undefined {
  const value = /^\d+$/.test(id) ? Number(id) : Number.NaN;
  return Number.isSafeInteger(value) && value >= 1 ? value : undefined;
}

/** Validate one page of GET /banks and map it into the UI model. */
export function mapBanksResponse(value: unknown): Page<Bank> {
  const pagination = isRecord(value) ? value.pagination : undefined;
  if (
    !isApiEnvelope(value) ||
    !isSuccessCode(value.code) ||
    !Array.isArray(value.data) ||
    !value.data.every(isBankDto) ||
    !isPaginationDto(pagination)
  ) {
    throw new AppError("server");
  }

  const items = value.data.map((bank) => ({
    id: String(bank.id),
    name: bank.title,
    logo: toLogo(bank.logo),
  }));
  return toPage(items, pagination);
}

async function getBankAccounts(page: number): Promise<Page<BankAccount>> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/bank-accounts",
    { query: { page, per_page: BANK_ACCOUNTS_PER_PAGE } },
  );
  return mapBankAccountsResponse(response);
}

/** The bank lookup is public: no bearer token (docs/api/bank-accounts-api.md R3). */
async function getBanks({ page, search }: BanksQuery): Promise<Page<Bank>> {
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>("/banks", {
    query: { page, per_page: BANKS_PER_PAGE, ...(search ? { search } : {}) },
  });
  return mapBanksResponse(response);
}

/** The add / edit body. A bank ID that is not a positive integer is not sent. */
function toAccountBody({ bankId, iban }: BankAccountPayload) {
  const bank = toApiId(bankId);
  if (bank === undefined) {
    throw new AppError("validation", "bankAccounts.unknownBank", undefined, {
      bankId: "bankAccounts.unknownBank",
    });
  }
  return { bank_id: bank, iban_number: normalizeIban(iban) };
}

/** A write's answer: `data` is the account, with the backend's message. */
function toAccountResult(response: unknown): Result<BankAccount> {
  if (
    !isApiEnvelope(response) ||
    !isSuccessCode(response.code) ||
    !isBankAccountDto(response.data)
  ) {
    throw new AppError("server");
  }
  return ok(toBankAccount(response.data), response.message);
}

/**
 * POST /bank-accounts as JSON (the API answers JSON with an integer `bank_id`).
 * Success is body code 201 (R1 accepts 200 too); `data` is the new account.
 */
async function addBankAccount(
  payload: BankAccountPayload,
): Promise<Result<BankAccount>> {
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/bank-accounts",
      toAccountBody(payload),
    );
    return toAccountResult(response);
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /update-bank-accounts/{id} as JSON with the bank and the IBAN (changing
 * the bank is supported, Q3). An unknown account, or another customer's, is
 * body code 404: `not_found` with the bank-account copy.
 */
async function updateBankAccount(
  id: string,
  payload: BankAccountPayload,
): Promise<Result<BankAccount>> {
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      `/update-bank-accounts/${toAccountId(id)}`,
      toAccountBody(payload),
    );
    return toAccountResult(response);
  } catch (error) {
    return fail(withAccountNotFound(error));
  }
}

/**
 * DELETE /bank-accounts/{id}. Success is body code 200 with `data: null` and
 * the backend's message; an unknown account is body code 404 (`not_found`).
 */
async function deleteBankAccount(id: string): Promise<Result<null>> {
  try {
    const response = await serverHttp.delete<ApiEnvelope<unknown>>(
      `/bank-accounts/${toAccountId(id)}`,
    );
    if (!isApiEnvelope(response) || !isSuccessCode(response.code)) {
      throw new AppError("server");
    }
    return ok(null, response.message);
  } catch (error) {
    return fail(withAccountNotFound(error));
  }
}

/**
 * An account ID for a path. Anything but a positive integer is `not_found`
 * without a request (a non-numeric path ID is an HTTP 500 on the API).
 */
function toAccountId(id: string): number {
  const accountId = toApiId(id);
  if (accountId === undefined) {
    throw new AppError("not_found", "bankAccounts.notFound");
  }
  return accountId;
}

/** The API's 404 (an unknown account, or another customer's) gets the bank-account copy. */
function withAccountNotFound(error: unknown): unknown {
  if (error instanceof AppError && error.kind === "not_found" && !error.code) {
    return new AppError("not_found", "bankAccounts.notFound", error.status, undefined, {
      cause: error,
      serverMessage: error.serverMessage,
    });
  }
  return error;
}

export const bankAccountsApi: BankAccountsApi = {
  getBankAccounts,
  getBanks,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
};
