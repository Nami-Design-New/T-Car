'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { BankAccount } from '@/features/bank-accounts';
import { bankAccountsApi } from '@/services/bankAccounts.api';
import { toAppError, type AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fromActionResult, ok, type Result } from '@/shared/lib/result';
import { topUpAction, withdrawAction } from '../actions';
import type { WalletData, WalletSummary, WalletTransaction, WithdrawParams } from '../model';

/** Wallet data arrives from the server; bank choices and writes keep their current API paths. */
export function useWallet(initialData: WalletData) {
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary>(initialData.summary);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialData.transactions);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setSummary(initialData.summary);
    setTransactions(initialData.transactions);
  }, [initialData]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    bankAccountsApi.getBankAccounts()
      .then((accounts) => {
        if (!active) return;
        setBankAccounts(accounts);
      })
      .catch((loadError: unknown) => {
        reportError(loadError, { scope: 'wallet.load' });
        if (active) setError(toAppError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setAttempt((count) => count + 1);
    router.refresh();
  }, [router]);

  const topUp = useCallback(
    async (amount: number): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(await topUpAction(amount, { summary, transactions }));
        if (!result.ok) return result;
        setSummary(result.data.summary);
        setTransactions(result.data.transactions);
        return ok(undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [summary, transactions]
  );

  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(
          await withdrawAction(params, { summary, transactions }, bankAccounts)
        );
        if (!result.ok) return result;
        setSummary(result.data.summary);
        setTransactions(result.data.transactions);
        return ok(undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [summary, transactions, bankAccounts]
  );

  return {
    summary,
    transactions,
    bankAccounts,
    loading,
    error,
    reload,
    submitting,
    topUp,
    withdraw,
  };
}
