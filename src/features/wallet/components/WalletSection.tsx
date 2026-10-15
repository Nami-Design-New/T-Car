'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { BankAccount } from '@/features/bank-accounts';
import type { AppError } from '@/shared/lib/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { ResultDialog } from '@/shared/ui/ResultDialog';
import { useWallet } from '../hooks/useWallet';
import { MIN_TOP_UP, MIN_WITHDRAW } from '../model';
import WalletTab from './WalletTab';
const WalletAmountModal = dynamic(() => import('./WalletAmountModal'), { ssr: false });
const BankSelectModal = dynamic(() => import('./BankSelectModal'), { ssr: false });

type ResultKind = 'topup' | 'withdraw';

/** One step at a time, so two wallet sheets can never be open together. */
type WalletFlow =
  | { step: 'idle' }
  | { step: 'topup-amount' }
  | { step: 'withdraw-bank' }
  | { step: 'withdraw-amount'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; error?: AppError }; // no error means success

const RESULT_KEYS: Record<ResultKind, { failure: string }> = {
  topup: { failure: 'topUpFailure' },
  withdraw: { failure: 'withdrawFailure' },
};

export default function WalletSection() {
  const t = useTranslations('wallet');
  const { summary, transactions, bankAccounts, loading, error, reload, submitting, topUp, withdraw } =
    useWallet();
  const errorMessage = useErrorMessage();
  const [flow, setFlow] = useState<WalletFlow>({ step: 'idle' });

  const close = useCallback(() => setFlow({ step: 'idle' }), []);

  const handleTopUp = async (amount: number) => {
    const result = await topUp(amount);
    setFlow({ step: 'result', kind: 'topup', error: result.ok ? undefined : result.error });
  };

  const handleWithdraw = async (account: BankAccount, amount: number) => {
    const result = await withdraw({ bankAccountId: account.id, amount });
    setFlow({ step: 'result', kind: 'withdraw', error: result.ok ? undefined : result.error });
  };

  return (
    <>
      <WalletTab
        summary={summary}
        transactions={transactions}
        loading={loading}
        error={error ?? undefined}
        onRetry={reload}
        onTopUp={() => setFlow({ step: 'topup-amount' })}
        onWithdraw={() => setFlow({ step: 'withdraw-bank' })}
      />

      <WalletAmountModal
        open={flow.step === 'topup-amount'}
        title={t('topUpTitle')}
        submitLabel={t('topUp')}
        min={MIN_TOP_UP}
        loading={submitting}
        onClose={close}
        onConfirm={handleTopUp}
      />

      <BankSelectModal
        open={flow.step === 'withdraw-bank'}
        accounts={bankAccounts}
        onClose={close}
        onSelect={(account) => setFlow({ step: 'withdraw-amount', account })}
      />

      <WalletAmountModal
        open={flow.step === 'withdraw-amount'}
        title={t('withdrawTitle')}
        submitLabel={t('withdraw')}
        min={MIN_WITHDRAW}
        max={summary.withdrawable}
        loading={submitting}
        onClose={close}
        onConfirm={(amount) => {
          if (flow.step === 'withdraw-amount') handleWithdraw(flow.account, amount);
        }}
      />

      {flow.step === 'result' && (
        <ResultDialog
          open
          status={flow.error ? 'error' : 'success'}
          description={flow.error ? errorMessage(flow.error) : undefined}
          onClose={close}
        />
      )}
    </>
  );
}
