'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { BankAccount } from '@/features/bank-accounts';
import { fromActionResult, ok, type Result } from '@/shared/lib/result';
import { topUpAction, withdrawAction } from '../actions';
import type {
  WalletData,
  WalletSummary,
  WalletTopUpPayment,
  WalletTransaction,
  WithdrawParams,
} from '../model';

/** Wallet data arrives from the server; a top-up returns a payment URL. Withdrawal keeps its current path. */
export function useWallet(initialData: WalletData) {
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary>(initialData.summary);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialData.transactions);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSummary(initialData.summary);
    setTransactions(initialData.transactions);
  }, [initialData]);

  /** Re-reads the wallet and bank accounts on the server. */
  const reload = useCallback(() => {
    router.refresh();
  }, [router]);

  const topUp = useCallback(
    async (amount: number): Promise<Result<WalletTopUpPayment>> => {
      setSubmitting(true);
      try {
        return fromActionResult(await topUpAction(amount));
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const withdraw = useCallback(
    /** `account` is the one chosen in the bank picker. */
    async (params: WithdrawParams, account: BankAccount): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(
          await withdrawAction(params, { summary, transactions }, [account])
        );
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

  return {
    summary,
    transactions,
    reload,
    submitting,
    topUp,
    withdraw,
  };
}
