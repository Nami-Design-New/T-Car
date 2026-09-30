'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BankAccount } from '@/features/bank-accounts';
import { walletApi } from '@/services/wallet.api';
import { toAppError, type AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fromActionResult, ok, type Result } from '@/shared/lib/result';
import { topUpAction, withdrawAction } from '../actions';
import type { WalletSummary, WalletTransaction, WithdrawParams } from '../model';

const EMPTY_SUMMARY: WalletSummary = { total: 0, withdrawable: 0, nonWithdrawable: 0 };

/** Wallet reads stay on the browser mock; writes cross the Server Action boundary. */
export function useWallet() {
  const [summary, setSummary] = useState<WalletSummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
