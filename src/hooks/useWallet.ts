'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BankAccount, WalletSummary, WalletTransaction } from '@app-types/car';
import { walletService, type WithdrawParams } from '@services/wallet.service';

const EMPTY_SUMMARY: WalletSummary = { total: 0, withdrawable: 0, nonWithdrawable: 0 };

/**
 * Wallet balance, history, and bank accounts, plus the top-up and withdraw
 * actions. Each action resolves to `true` on success and refreshes the wallet.
 */
export function useWallet() {
  const [summary, setSummary] = useState<WalletSummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const data = await walletService.getWallet();
    setSummary(data.summary);
    setTransactions(data.transactions);
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([walletService.getWallet(), walletService.getBankAccounts()])
      .then(([data, accounts]) => {
        if (!active) return;
        setSummary(data.summary);
        setTransactions(data.transactions);
        setBankAccounts(accounts);
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

  const topUp = useCallback((amount: number) => run(() => walletService.topUp(amount)), [run]);

  const withdraw = useCallback(
    (params: WithdrawParams) => run(() => walletService.withdraw(params)),
    [run]
  );

  return { summary, transactions, bankAccounts, loading, submitting, topUp, withdraw };
}
