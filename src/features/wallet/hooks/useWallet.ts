'use client';

import { useCallback, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { fromActionResult, type Result } from '@/shared/lib/result';
import { topUpAction, withdrawAction } from '../actions';
import type {
  WalletData,
  WalletTopUpPayment,
  WalletTransaction,
  WithdrawParams,
} from '../model';

/**
 * The API owns the balance: the wallet shows what the server read, and every
 * write is followed by a re-read (`router.refresh()`) instead of a local change.
 */
export function useWallet(initialData: WalletData) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  /** Re-reads the wallet on the server. */
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

  /** Requests the withdrawal, then re-reads the wallet for the new balance and row. */
  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<Result<WalletTransaction>> => {
      setSubmitting(true);
      try {
        const result = fromActionResult(await withdrawAction(params));
        if (result.ok) router.refresh();
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    [router]
  );

  return {
    summary: initialData.summary,
    transactions: initialData.transactions,
    reload,
    submitting,
    topUp,
    withdraw,
  };
}
