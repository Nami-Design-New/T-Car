"use server";

import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import type { Page } from "@/shared/lib/pagination";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import { bankAccountsApi } from "./api";
import type { Bank, BankAccount, BankAccountPayload } from "./model";
import { bankAccountSchema } from "./validation";

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/**
 * The API's account IDs are positive integers; anything else is rejected here,
 * before a request (a non-numeric path ID is an HTTP 500 on the API).
 */
function toAccountId(id: string): number {
  const value = /^\d+$/.test(id) ? Number(id) : Number.NaN;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new AppError("not_found", "bankAccounts.notFound");
  }
  return value;
}

async function run<T>(scope: string, write: () => T): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return toActionResult(ok(write()));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

/**
 * One page of the customer's accounts from GET /bank-accounts, for the bank
 * picker (read when it opens, so an account added meanwhile is listed).
 */
export async function getBankAccountsAction(
  page: number,
): Promise<ActionResult<Page<BankAccount>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (!Number.isInteger(page) || page < 1) throw new AppError("validation");
    return toActionResult(ok(await bankAccountsApi.getBankAccounts(page)));
  } catch (error) {
    reportError(error, { scope: "bankAccounts.list" });
    return toActionResult(fail(error));
  }
}

/** Longest search term sent to GET /banks; bank titles are far shorter. */
const MAX_BANK_SEARCH_LENGTH = 100;

/**
 * One page of the bank lookup from GET /banks, optionally filtered by title.
 * The endpoint is public, so no session is required.
 */
export async function getBanksAction(
  page: number,
  search?: string,
): Promise<ActionResult<Page<Bank>>> {
  try {
    if (!Number.isInteger(page) || page < 1) throw new AppError("validation");
    if (search !== undefined && typeof search !== "string")
      throw new AppError("validation");
    const term = search?.trim().slice(0, MAX_BANK_SEARCH_LENGTH) || undefined;
    return toActionResult(
      ok(await bankAccountsApi.getBanks({ page, search: term })),
    );
  } catch (error) {
    reportError(error, { scope: "bankAccounts.banks" });
    return toActionResult(fail(error));
  }
}

/**
 * Adds an account through POST /bank-accounts. The form values are parsed
 * again here; the API decides the rest (the bank exists, ...). Success carries
 * the backend's message for the toast; a backend 422 keeps its message as
 * `serverMessage`.
 */
export async function addBankAccountAction(
  payload: BankAccountPayload,
): Promise<ActionResult<BankAccount>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const values = parse(bankAccountSchema, payload);
    const result = await bankAccountsApi.addBankAccount(values);
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "bankAccounts.add" });
    return toActionResult(fail(error));
  }
}

/**
 * Changes an account's bank and IBAN through POST /update-bank-accounts/{id}.
 * Like add: values parsed again, the backend's message on success, a 422's
 * message as `serverMessage`; an unknown account is `not_found`.
 */
export async function updateBankAccountAction(
  id: string,
  payload: BankAccountPayload,
): Promise<ActionResult<BankAccount>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const values = parse(bankAccountSchema, payload);
    const result = await bankAccountsApi.updateBankAccount(id, values);
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "bankAccounts.update" });
    return toActionResult(fail(error));
  }
}

/**
 * Not sent to the API yet (B6 in docs/api/bank-accounts-api.md): checks the
 * session and the account ID, then succeeds without changing anything.
 */
export async function deleteBankAccountAction(
  id: string,
): Promise<ActionResult<null>> {
  return run("bankAccounts.delete", () => {
    toAccountId(id);
    return null;
  });
}
