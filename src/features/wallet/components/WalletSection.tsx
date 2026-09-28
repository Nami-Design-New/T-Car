'use client';

import { useCallback, useState } from 'react';
import type { BankAccount } from '@/features/bank-accounts';
import { useWallet } from '../hooks/useWallet';
import { MIN_TOP_UP, MIN_WITHDRAW } from '../model';
import WalletTab from './WalletTab';
import WalletAmountModal from './WalletAmountModal';
import BankSelectModal from './BankSelectModal';
import SuccessModal from '@components/common/SuccessModal';
import FailedModal from '@components/common/FailedModal';

type ResultKind = 'topup' | 'withdraw';

/** One step at a time, so two wallet sheets can never be open together. */
type WalletFlow =
  | { step: 'idle' }
  | { step: 'topup-amount' }
  | { step: 'withdraw-bank' }
  | { step: 'withdraw-amount'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; ok: boolean };

const RESULT_TITLES: Record<ResultKind, { success: string; failure: string }> = {
  topup: { success: 'تمت الشحن بنجاح', failure: 'فشل في عملية الشحن' },
  withdraw: { success: 'تم السحب بنجاح', failure: 'فشل في عملية السحب' },
};

export default function WalletSection() {
  const { summary, transactions, bankAccounts, loading, submitting, topUp, withdraw } =
    useWallet();
  const [flow, setFlow] = useState<WalletFlow>({ step: 'idle' });

  const close = useCallback(() => setFlow({ step: 'idle' }), []);

  const handleTopUp = async (amount: number) => {
    const ok = await topUp(amount);
    setFlow({ step: 'result', kind: 'topup', ok });
  };

  const handleWithdraw = async (account: BankAccount, amount: number) => {
    const ok = await withdraw({ bankAccountId: account.id, amount });
    setFlow({ step: 'result', kind: 'withdraw', ok });
  };

  return (
    <>
      <WalletTab
        summary={summary}
        transactions={transactions}
        loading={loading}
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

      {flow.step === 'result' && flow.ok && (
        <SuccessModal
          open
          appearButton={false}
          title={RESULT_TITLES[flow.kind].success}
          description=""
          onDone={close}
        />
      )}

      <FailedModal
        open={flow.step === 'result' && !flow.ok}
        title={flow.step === 'result' ? RESULT_TITLES[flow.kind].failure : undefined}
        onDone={close}
      />
    </>
  );
}
