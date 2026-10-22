'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { extendBookingSchema, type ExtendBookingFormValues } from '../validation';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (newDays: number) => void;
  currentDays?: number;
  pricePerDay?: number;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function ExtendDurationModal({
  open,
  onClose,
  onConfirm,
  currentDays = 1,
  pricePerDay = 500,
  loading = false,
  error,
}: Props) {
  const t = useTranslations('myBookings.extend');
  const fieldError = useFieldErrorMessage();
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExtendBookingFormValues>({
    resolver: zodResolver(extendBookingSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { days: currentDays },
  });
  const days = watch('days');

  useEffect(() => {
    if (open) reset({ days: currentDays });
  }, [currentDays, open, reset]);

  const increment = () => {
    setValue('days', days + 1, { shouldDirty: true, shouldValidate: true });
  };

  const decrement = () => {
    setValue('days', Math.max(1, days - 1), { shouldDirty: true, shouldValidate: true });
  };

  const subtotal = days * pricePerDay;
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  const submit = handleSubmit(({ days: nextDays }) => onConfirm(nextDays));

  return (
    <Dialog open={open} onClose={onClose} placement="bottom-sheet" label={t('title')}>
      <form className="selection_modal extend_modal" onSubmit={submit} noValidate>
        {/* Close */}
        {/* Header */}
        <div className="modal_header">
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Close className="close_btn" />
        </div>

        {/* Duration */}
        <div className="duration_picker">
          <p className="label">{t('selectDays')}</p>

          <div className="picker_controls">
            <button type="button" className="plus" onClick={increment} aria-label={t('increase')}>
              +
            </button>

            <div className="days_display">{days}</div>

            <button type="button" className="minus" onClick={decrement} aria-label={t('decrease')}>
              −
            </button>
          </div>

          <p className="note">{t('note')}</p>
          {errors.days && (
            <p className="form_error" role="alert">
              {fieldError(errors.days.message)}
            </p>
          )}
        </div>

        {/* Price Details */}
        <div className="price_details">
          <h3 className="details_title">{t('priceDetails')}</h3>

          {/* السعر */}
          <div className="row">
            <span className="label">{t('price')}</span>

            <span className="calculation"></span>

            <strong>
              {pricePerDay} {t('currency')}
            </strong>
          </div>

          {/* المجموع الفرعي */}
          <div className="row">
            <span className="label">{t('subtotal')}</span>

            <span className="calculation">
              {days} × {pricePerDay}
            </span>

            <strong>
              {subtotal} {t('currency')}
            </strong>
          </div>

          {/* غرامة التأخير */}
          <div className="row late_fee">
            <span className="label">{t('lateFee')}</span>

            <span className="calculation">{t('oneDay')}</span>

            <strong>0 {t('currency')}</strong>
          </div>

          {/* الضريبة */}
          <div className="row">
            <span className="label">{t('vat')}</span>

            <span className="calculation">5%</span>

            <strong>
              {vat} {t('currency')}
            </strong>
          </div>

          {/* الإجمالي */}
          <div className="row total">
            <span className="label">{t('total')}</span>

            <span className="calculation"></span>

            <strong>
              {total} {t('currency')}
            </strong>
          </div>
        </div>

        {error && (
          <p className="text-danger small mb-2" role="alert">
            {error}
          </p>
        )}

        {/* Confirm */}
        <Button
          type="submit"
          className="confirm_btn"
          loading={loading}
        >
          {loading ? t('extending') : t('confirm')}
        </Button>
      </form>
    </Dialog>
  );
}
