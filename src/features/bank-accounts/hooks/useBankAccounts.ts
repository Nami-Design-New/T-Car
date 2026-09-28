'use client';

import { useCallback, useEffect, useState } from 'react';
import { bankAccountsApi } from '@/services/bankAccounts.api';
import { toAppError, type AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, type Result } from '@/shared/lib/result';
import type { Bank, BankAccount, BankAccountPayload } from '../model';

/**
 * The user's bank accounts and the banks they can pick from, plus the add,
 * update, and remove actions. `error` is set when the initial load fails;
 * `reload` retries it. Each action resolves to a Result and refreshes the
 * list on success.
 */
export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(async () => {
    setAccounts(await bankAccountsApi.getBankAccounts());
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([bankAccountsApi.getBankAccounts(), bankAccountsApi.getBanks()])
      .then(([accountList, bankList]) => {
        if (!active) return;
        setAccounts(accountList);
        setBanks(bankList);
      })
      .catch((loadError: unknown) => {
        reportError(loadError, { scope: 'bankAccounts.load' });
        if (active) setError(toAppError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        try {
          await action();
        } catch (actionError) {
          reportError(actionError, { scope: 'bankAccounts.action' });
          return fail(actionError);
        }

        // The action went through; a failed refresh must not report it as failed.
        try {
          await refresh();
        } catch (refreshError) {
          reportError(refreshError, { scope: 'bankAccounts.refresh' });
        }
        return ok(undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const add = useCallback(
    (payload: BankAccountPayload) => run(() => bankAccountsApi.addBankAccount(payload)),
    [run]
  );

  const update = useCallback(
    (id: string, payload: BankAccountPayload) =>
      run(() => bankAccountsApi.updateBankAccount(id, payload)),
    [run]
  );

  const remove = useCallback(
    (id: string) => run(() => bankAccountsApi.deleteBankAccount(id)),
    [run]
  );

  return { accounts, banks, loading, error, reload, submitting, add, update, remove };
}
