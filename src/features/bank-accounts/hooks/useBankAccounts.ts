'use client';

import { useEffect, useState } from 'react';
import { bankAccountsApi } from '@/services/bankAccounts.api';
import { toAppError, type AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fromActionResult, ok, type Result } from '@/shared/lib/result';
import type { Bank, BankAccount, BankAccountPayload } from '../model';
import { addBankAccountAction, deleteBankAccountAction, updateBankAccountAction } from '../actions';

/** Bank reads stay on the browser mock; writes cross the Server Action boundary. */
export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

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

  const reload = () => setAttempt((count) => count + 1);

  const add = async (payload: BankAccountPayload): Promise<Result<void>> => {
    setSubmitting(true);
    try {
      const result = fromActionResult(await addBankAccountAction(payload, accounts));
      if (!result.ok) return result;
      setAccounts(result.data);
      return ok(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const update = async (id: string, payload: BankAccountPayload): Promise<Result<void>> => {
    setSubmitting(true);
    try {
      const result = fromActionResult(await updateBankAccountAction(id, payload, accounts));
      if (!result.ok) return result;
      setAccounts(result.data);
      return ok(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string): Promise<Result<void>> => {
    setSubmitting(true);
    try {
      const result = fromActionResult(await deleteBankAccountAction(id, accounts));
      if (!result.ok) return result;
      setAccounts(result.data);
      return ok(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return { accounts, banks, loading, error, reload, submitting, add, update, remove };
}
