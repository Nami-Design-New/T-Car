"use client";

import { useCallback, useState } from "react";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import {
  fromActionResult,
  ok,
  type ActionResult,
  type Result,
} from "@/shared/lib/result";
import type { BankAccountPayload } from "../model";
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

  const write = useCallback(
    async (
      action: () => Promise<ActionResult<null>>,
    ): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(await action());
        if (!result.ok) return result;
        refresh();
        return ok(undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const add = (payload: BankAccountPayload) =>
    write(() => addBankAccountAction(payload));
  const update = (id: string, payload: BankAccountPayload) =>
    write(() => updateBankAccountAction(id, payload));
  const remove = (id: string) => write(() => deleteBankAccountAction(id));

  return { accounts, submitting, add, update, remove };
}
