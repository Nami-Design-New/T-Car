'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { ICONS } from '@/shared/config/assets';
import { useErrorMessage, useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { formatAmount } from '@/shared/lib/format';
import { applyFieldErrors } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/Button';
import { FormInput } from '@/shared/ui/Form';
import { Dialog } from '@/shared/ui/Dialog';
import { amountFormSchema, amountSchema, type WalletAmountValues } from '../validation';
const sarIcon = ICONS.riyal;

interface Props {
  open: boolean;
  title: string;
  submitLabel: string;
  min: number;
  max?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<AppError | undefined>;
}

/** Amount entry sheet shared by wallet top-up and withdrawal. */
export default function WalletAmountModal({
  open,
  title,
  submitLabel,
  min,
  max,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations('wallet.amount');
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const inputRef = useRef<HTMLInputElement>(null);
  const schema = amountSchema(min, max);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<WalletAmountValues>({
    resolver: zodResolver(amountFormSchema(min, max)),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { ref: registerRef, ...amountField } = register('amount', {
    setValueAs: (value) => (value === '' ? undefined : Number(value)),
  });
  const amount = watch('amount');
  const valid = schema.safeParse(amount).success;
  const hintId = 'wallet-amount-hint';
  const amountError = fieldError(errors.amount?.message);
  const submitError = errors.root?.server?.message;

  const onSubmit = handleSubmit(async ({ amount }) => {
    if (loading) return;
    try {
      const error = await onConfirm(amount);
      if (error && !applyFieldErrors(error, setError, ['amount'])) {
        setError('root.server', { type: error.kind, message: errorMessage(error) });
      }
    } catch (error) {
      setError('root.server', { type: 'server', message: errorMessage(error) });
    }
  });

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="wallet_topup_modal"
      placement="bottom-sheet"
      initialFocusRef={inputRef}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <span className="wallet_topup_drag_handle" aria-hidden="true" />
      <Dialog.Header className="wallet_topup_header d-flex align-items-center justify-content-between">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close className="wallet_topup_close btn btn-light d-grid p-0" />
      </Dialog.Header>

      <Dialog.Body className="wallet_topup_body">
        <form onSubmit={onSubmit} noValidate>
          <div className="wallet_topup_input_group">
            <FormInput
              {...amountField}
              ref={(element) => {
                registerRef(element);
                inputRef.current = element;
              }}
              id="wallet-amount"
              label={title}
              type="number"
              min={min}
              max={max}
              inputMode="decimal"
              placeholder="00"
              aria-describedby={hintId}
              required
              error={amountError}
              className="wallet_topup_input"
              icon={<Image src={sarIcon} alt="" width={18} height={18} className="currency_icon" />}
            />
          </div>
          <small id={hintId} className={`wallet_topup_hint ${amountError ? 'invalid' : ''}`}>
            {max === undefined
              ? t('rangeMin', { min: formatAmount(min) })
              : t('rangeWithMax', { min: formatAmount(min), max: formatAmount(max) })}
          </small>
          {submitError && (
            <p className="text-danger small mt-2 mb-0" role="alert">
              {submitError}
            </p>
          )}
          <Button type="submit" className="wallet_topup_submit w-100" disabled={!valid} loading={loading}>
            {submitLabel}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
