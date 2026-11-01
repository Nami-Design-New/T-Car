"use client";

import { useCallback, useState } from "react";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { AppError } from "@/shared/lib/errors";
import {
  fail,
  fromActionResult,
  ok,
  type ActionResult,
  type Result,
} from "@/shared/lib/result";
import { normalizeIban, type BankAccountPayload } from "../model";
import {
  addBankAccountAction,
  deleteBankAccountAction,
  getBankAccountsAction,
  updateBankAccountAction,
} from "../actions";

/**
 * The customer's accounts, read page by page from GET /bank-accounts, and the
 * writes (Server Actions). After a successful write the list is read again
 * from page 1, so it always shows what the API holds.
 */
export function useBankAccounts() {
  const fetchPage = useCallback(
    async (page: number) => fromActionResult(await getBankAccountsAction(page)),
    [],
  );
  const accounts = usePaginatedList(fetchPage, { scope: "bankAccounts.list" });
  const { refresh } = accounts;
  const [submitting, setSubmitting] = useState(false);

  /** Runs a write; on success re-reads the list and keeps the backend's message. */
  const write = useCallback(
    async <T,>(
      action: () => Promise<ActionResult<T>>,
    ): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(await action());
        if (!result.ok) return result;
        refresh();
        return ok(undefined, result.message);
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  /**
   * No duplicate accounts (docs/api/bank-accounts-api.md R7): an IBAN already
   * in the loaded accounts is refused before the request. The API accepts
   * duplicates, so accounts on pages not loaded yet are not checked.
   */
  const isDuplicate = (iban: string) => {
    const normalized = normalizeIban(iban);
    return accounts.items.some((account) => account.iban === normalized);
  };

  const add = (payload: BankAccountPayload) =>
    isDuplicate(payload.iban)
      ? Promise.resolve(fail(duplicateIbanError()))
      : write(() => addBankAccountAction(payload));
  const update = (id: string, payload: BankAccountPayload) =>
    write(() => updateBankAccountAction(id, payload));
  const remove = (id: string) => write(() => deleteBankAccountAction(id));

  return { accounts, submitting, add, update, remove };
}

const duplicateIbanError = () =>
  new AppError("validation", "bankAccounts.duplicateIban", undefined, {
    iban: "bankAccounts.duplicateIban",
  });
