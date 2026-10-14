'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AppError } from '@/shared/lib/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ResultDialog } from '@/shared/ui/ResultDialog';
import type { BankAccount, BankAccountPayload } from '../model';
import { useBankAccounts } from '../hooks/useBankAccounts';
import BankAccountsTab from './BankAccountsTab';
import BankAccountFormModal from './BankAccountFormModal';

type ResultKind = 'added' | 'updated' | 'deleted';

/** One step at a time, so two bank account sheets can never be open together. */
type BankAccountsFlow =
  | { step: 'idle' }
  | { step: 'add' }
  | { step: 'edit'; account: BankAccount }
  | { step: 'confirm-delete'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; error?: AppError }; // no error means success

const RESULT_KEYS: Record<ResultKind, { failure: string }> = {
  added: { failure: 'addedFailure' },
  updated: { failure: 'updatedFailure' },
  deleted: { failure: 'deletedFailure' },
};

export default function BankAccountsSection() {
  const t = useTranslations('bankAccounts');
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
        error={error ?? undefined}
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

      <ConfirmDialog
        open={flow.step === 'confirm-delete'}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription')}
        confirmLabel={
          submitting
            ? t('deleting')
            : t('delete', {
                bank: flow.step === 'confirm-delete' ? flow.account.bankName : '',
              })
        }
        cancelLabel={t('cancel')}
        tone="danger"
        pending={submitting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!submitting) close();
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
