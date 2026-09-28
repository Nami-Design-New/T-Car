'use client';

import { useCallback, useState } from 'react';
import type { AppError } from '@/shared/lib/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { BankAccount, BankAccountPayload } from '../model';
import { useBankAccounts } from '../hooks/useBankAccounts';
import BankAccountsTab from './BankAccountsTab';
import BankAccountFormModal from './BankAccountFormModal';
import SuccessModal from '@components/common/SuccessModal';
import FailedModal from '@components/common/FailedModal';

type ResultKind = 'added' | 'updated' | 'deleted';

/** One step at a time, so two bank account sheets can never be open together. */
type BankAccountsFlow =
  | { step: 'idle' }
  | { step: 'add' }
  | { step: 'edit'; account: BankAccount }
  | { step: 'confirm-delete'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; error?: AppError }; // no error means success

const RESULT_TITLES: Record<ResultKind, { success: string; failure: string }> = {
  added: { success: 'تم إضافة حسابك بنجاح', failure: 'فشل في إضافة الحساب البنكي' },
  updated: { success: 'تم حفظ تعديلك بنجاح', failure: 'فشل في حفظ التعديل' },
  deleted: { success: 'تم حذف حسابك بنجاح', failure: 'فشل في حذف الحساب البنكي' },
};

export default function BankAccountsSection() {
  const { accounts, banks, loading, error, reload, submitting, add, update, remove } =
    useBankAccounts();
  const errorMessage = useErrorMessage();
  const [flow, setFlow] = useState<BankAccountsFlow>({ step: 'idle' });

  const close = useCallback(() => setFlow({ step: 'idle' }), []);

  const handleSubmit = async (payload: BankAccountPayload) => {
    if (flow.step === 'add') {
      const result = await add(payload);
      setFlow({ step: 'result', kind: 'added', error: result.ok ? undefined : result.error });
    } else if (flow.step === 'edit') {
      const result = await update(flow.account.id, payload);
      setFlow({ step: 'result', kind: 'updated', error: result.ok ? undefined : result.error });
    }
  };

  const handleDelete = async () => {
    if (flow.step !== 'confirm-delete' || submitting) return;

    const result = await remove(flow.account.id);
    setFlow({ step: 'result', kind: 'deleted', error: result.ok ? undefined : result.error });
  };

  return (
    <>
      <BankAccountsTab
        accounts={accounts}
        loading={loading}
        error={error ? errorMessage(error) : undefined}
        onRetry={reload}
        onAdd={() => setFlow({ step: 'add' })}
        onEdit={(account) => setFlow({ step: 'edit', account })}
        onDelete={(account) => setFlow({ step: 'confirm-delete', account })}
      />

      <BankAccountFormModal
        open={flow.step === 'add' || flow.step === 'edit'}
        mode={flow.step === 'edit' ? 'edit' : 'add'}
        banks={banks}
        account={flow.step === 'edit' ? flow.account : undefined}
        loading={submitting}
        onClose={close}
        onConfirm={handleSubmit}
      />

      <FailedModal
        open={flow.step === 'confirm-delete'}
        title="حذف الحساب البنكي؟"
        description="هل أنت متأكد من رغبتك في حذف هذا الحساب البنكي؟ لن تتمكن من استخدامه في عمليات السحب بعد حذفه."
        showButtons
        primaryButtonText={submitting ? 'جاري الحذف...' : 'حذف'}
        secondaryButtonText="تراجع"
        onPrimary={handleDelete}
        onSecondary={() => {
          if (!submitting) close();
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
