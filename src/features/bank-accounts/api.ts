import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
import { maskIban, normalizeIban, type BankAccount } from "./model";

/** The live read. The bank accounts tab still uses `services/bankAccounts.api` (mock). */
export interface BankAccountsReadApi {
  getBankAccounts(page: number): Promise<Page<BankAccount>>;
}

/** Accounts per page; the picker loads the next page on scroll. */
export const BANK_ACCOUNTS_PER_PAGE = 10;

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
    value.code !== 200 ||
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

async function getBankAccounts(page: number): Promise<Page<BankAccount>> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/bank-accounts",
    { query: { page, per_page: BANK_ACCOUNTS_PER_PAGE } },
  );
  return mapBankAccountsResponse(response);
}

export const bankAccountsApi: BankAccountsReadApi = { getBankAccounts };
