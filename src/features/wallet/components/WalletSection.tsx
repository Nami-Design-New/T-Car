'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { BankAccount } from '@/features/bank-accounts';
import type { AppError } from '@/shared/lib/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { ResultDialog } from '@/shared/ui/ResultDialog';
import { useWallet } from '../hooks/useWallet';
import { MIN_TOP_UP, MIN_WITHDRAW } from '../model';
import WalletTab from './WalletTab';
const WalletAmountModal = dynamic(() => import('./WalletAmountModal'), { ssr: false });
const BankSelectModal = dynamic(() => import('./BankSelectModal'), { ssr: false });

interface LegacyResultProps {
  open: boolean;
  title?: string;
  description?: string;
  onDone?: () => void;
  appearButton?: boolean;
}

function SuccessModal({ open, title = '', onDone }: LegacyResultProps) {
  return <ResultDialog open={open} status="success" title={title} autoCloseMs={2000} onClose={onDone ?? (() => undefined)} />;
}

function FailedModal({ open, title = '', description, onDone }: LegacyResultProps) {
  return <ResultDialog open={open} status="error" title={title} description={description} onClose={onDone ?? (() => undefined)} />;
}

type ResultKind = 'topup' | 'withdraw';

/** One step at a time, so two wallet sheets can never be open together. */
type WalletFlow =
  | { step: 'idle' }
  | { step: 'topup-amount' }
  | { step: 'withdraw-bank' }
  | { step: 'withdraw-amount'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; error?: AppError }; // no error means success

const RESULT_TITLES: Record<ResultKind, { success: string; failure: string }> = {
  topup: { success: 'تمت الشحن بنجاح', failure: 'فشل في عملية الشحن' },
  withdraw: { success: 'تم السحب بنجاح', failure: 'فشل في عملية السحب' },
};

export default function WalletSection() {
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
        title="اشحن المحفظة"
        submitLabel="شحن"
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
        title="اسحب الرصيد"
        submitLabel="سحب"
        min={MIN_WITHDRAW}
        max={summary.withdrawable}
        loading={submitting}
        onClose={close}
        onConfirm={(amount) => {
          if (flow.step === 'withdraw-amount') handleWithdraw(flow.account, amount);
        }}
      />

      {flow.step === 'result' && !flow.error && (
        <SuccessModal
          open
          appearButton={false}
          title={RESULT_TITLES[flow.kind].success}
          description=""
          onDone={close}
        />
      )}

      <FailedModal
        open={flow.step === 'result' && Boolean(flow.error)}
        title={flow.step === 'result' ? RESULT_TITLES[flow.kind].failure : undefined}
        description={flow.step === 'result' && flow.error ? errorMessage(flow.error) : undefined}
        onDone={close}
      />
    </>
  );
}
