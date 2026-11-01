import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp, serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
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
 * The live reads: the customer's accounts (the tab and the wallet's bank
 * picker) and the bank lookup (the add / edit form).
 */
export interface BankAccountsReadApi {
  getBankAccounts(page: number): Promise<Page<BankAccount>>;
  getBanks(query: BanksQuery): Promise<Page<Bank>>;
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

  const items = value.data.map((account) => ({
    id: String(account.id),
    bankId: String(account.bank_id),
    bankName: account.title,
    logo: toLogo(account.logo),
    iban: normalizeIban(account.iban_number),
    maskedNumber: maskIban(account.iban_number),
  }));
  return toPage(items, pagination);
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

export const bankAccountsApi: BankAccountsReadApi = {
  getBankAccounts,
  getBanks,
};
