'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiX } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';

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
  const [days, setDays] = useState(currentDays);
  const t = useTranslations('myBookings.extend');

  useEffect(() => {
    setDays(currentDays);
  }, [currentDays, open]);

  const increment = () => {
    setDays((d) => d + 1);
  };

  const decrement = () => {
    setDays((d) => Math.max(1, d - 1));
  };

  const subtotal = days * pricePerDay;
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;

  return (
    <Dialog open={open} onClose={onClose} placement="bottom-sheet" label="Extend booking">
      <div className="selection_modal extend_modal">

        {/* Close */}
        <button
          type="button"
          className="close_btn"
          onClick={onClose}
          aria-label={t('close')}
        >
          <FiX />
        </button>

        {/* Header */}
        <div className="modal_header">
          <h2>{t('title')}</h2>
        </div>

        {/* Duration */}
        <div className="duration_picker">

          <p className="label">
            {t('selectDays')}
          </p>

          <div className="picker_controls">

            <button
              type="button"
              className="plus"
              onClick={increment}
              aria-label={t('increase')}
            >
              +
            </button>

            <div className="days_display">
              {days}
            </div>

            <button
              type="button"
              className="minus"
              onClick={decrement}
              aria-label={t('decrease')}
            >
              −
            </button>

          </div>

          <p className="note">
            {t('note')}
          </p>

        </div>

        {/* Price Details */}
        <div className="price_details">

          <h3 className="details_title">
            {t('priceDetails')}
          </h3>

          {/* السعر */}
          <div className="row">
            <span className="label">
              {t('price')}
            </span>

            <span className="calculation">
            </span>

            <strong>
              {pricePerDay} {t('currency')}
            </strong>
          </div>

          {/* المجموع الفرعي */}
          <div className="row">
            <span className="label">
              {t('subtotal')}
            </span>

            <span className="calculation">
              {days} × {pricePerDay}
            </span>

            <strong>
              {subtotal} {t('currency')}
            </strong>
          </div>

          {/* غرامة التأخير */}
          <div className="row late_fee">
            <span className="label">
              {t('lateFee')}
            </span>

            <span className="calculation">
              {t('oneDay')}
            </span>

            <strong>
              0 {t('currency')}
            </strong>
          </div>

          {/* الضريبة */}
          <div className="row">
            <span className="label">
              {t('vat')}
            </span>

            <span className="calculation">
              5%
            </span>

            <strong>
              {vat} {t('currency')}
            </strong>
          </div>

          {/* الإجمالي */}
          <div className="row total">
            <span className="label">
              {t('total')}
            </span>

            <span className="calculation">
            </span>

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
        <button
          type="button"
          className="confirm_btn"
          onClick={() => onConfirm(days)}
          disabled={loading}
        >
          {loading ? t('extending') : t('confirm')}
        </button>

      </div>
    </Dialog>
  );
}
