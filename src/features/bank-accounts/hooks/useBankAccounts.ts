'use client';

import { useCallback, useEffect, useState } from 'react';
import { bankAccountsApi } from '@/services/bankAccounts.api';
import type { Bank, BankAccount, BankAccountPayload } from '../model';

/**
 * The user's bank accounts and the banks they can pick from, plus the add,
 * update, and remove actions. Each action resolves to `true` on success and
 * refreshes the list.
 */
export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setAccounts(await bankAccountsApi.getBankAccounts());
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([bankAccountsApi.getBankAccounts(), bankAccountsApi.getBanks()])
      .then(([accountList, bankList]) => {
        if (!active) return;
        setAccounts(accountList);
        setBanks(bankList);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setSubmitting(true);
      try {
        await action();
        await refresh();
        return true;
      } catch {
        return false;
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

  return { accounts, banks, loading, submitting, add, update, remove };
}
