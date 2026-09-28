'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bank, BankAccount, BankAccountPayload } from '@app-types/car';
import { bankAccountsService } from '@services/bankAccounts.service';

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
    setAccounts(await bankAccountsService.getBankAccounts());
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([bankAccountsService.getBankAccounts(), bankAccountsService.getBanks()])
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
    (payload: BankAccountPayload) => run(() => bankAccountsService.addBankAccount(payload)),
    [run]
  );

  const update = useCallback(
    (id: string, payload: BankAccountPayload) =>
      run(() => bankAccountsService.updateBankAccount(id, payload)),
    [run]
  );

  const remove = useCallback(
    (id: string) => run(() => bankAccountsService.deleteBankAccount(id)),
    [run]
  );

  return { accounts, banks, loading, submitting, add, update, remove };
}
