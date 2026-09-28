'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BankAccount } from '@/features/bank-accounts';
import { walletApi } from '@/services/wallet.api';
import { toAppError, type AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, type Result } from '@/shared/lib/result';
import type { WalletSummary, WalletTransaction, WithdrawParams } from '../model';

const EMPTY_SUMMARY: WalletSummary = { total: 0, withdrawable: 0, nonWithdrawable: 0 };

/**
 * Wallet balance, history, and bank accounts, plus the top-up and withdraw
 * actions. `error` is set when the initial load fails; `reload` retries it.
 * Each action resolves to a Result and refreshes the wallet on success.
 */
export function useWallet() {
  const [summary, setSummary] = useState<WalletSummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(async () => {
    const data = await walletApi.getWallet();
    setSummary(data.summary);
    setTransactions(data.transactions);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([walletApi.getWallet(), walletApi.getBankAccounts()])
      .then(([data, accounts]) => {
        if (!active) return;
        setSummary(data.summary);
        setTransactions(data.transactions);
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

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        try {
          await action();
        } catch (actionError) {
          reportError(actionError, { scope: 'wallet.action' });
          return fail(actionError);
        }

        // The action went through; a failed refresh must not report it as failed.
        try {
          await refresh();
        } catch (refreshError) {
          reportError(refreshError, { scope: 'wallet.refresh' });
        }
        return ok(undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const topUp = useCallback((amount: number) => run(() => walletApi.topUp(amount)), [run]);

  const withdraw = useCallback(
    (params: WithdrawParams) => run(() => walletApi.withdraw(params)),
    [run]
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
