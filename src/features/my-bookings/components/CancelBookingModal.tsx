'use client';

import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/shared/ui/Dialog';

import cancelBookingImage from '@/assets/icons/cancel_booking.svg';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;

  bookingAmount: number;
  cancellationPercent: number;
  cancellationFee: number;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  bookingAmount,
  cancellationPercent,
  cancellationFee,
  loading = false,
  error,
}: Props) {
  const refundedAmount = bookingAmount - cancellationFee;
  const t = useTranslations('myBookings.cancel');

  return (
  
    <Dialog open={open} onClose={onClose} placement="bottom-sheet" label={t('dialogLabel')}>
      <div className=" selection_modal cancel_booking_modal">
         {/* Close */}
        <button
          type="button"
          className="close_btn"
          onClick={onClose}
          aria-label={t('close')}
        >
          <FiX />
        </button>

        <div className="cancel_booking_modal_header">
          <h2>{t('title')}</h2>
        </div>

        <div className="cancel_booking_modal_illustration">
          <Image src={cancelBookingImage} alt={t('title')} width={140} height={110} />
        </div>

        <div className="cancel_booking_modal_question">
          <h3>{t('question')}</h3>
        </div>

        <div className="cancel_booking_modal_warning">
          <p>{t('warning', { percent: cancellationPercent })}</p>
        </div>

        <div className="cancel_booking_modal_price_details">
          <h3 className="cancel_booking_modal_details_title">{t('amountDetails')}</h3>

          <div className="cancel_booking_modal_row">
            <span>{t('paid')}</span>
            <strong>{bookingAmount} {t('currency')}</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--danger">
            <span>{t('discountPercent')}</span>
            <strong>{cancellationPercent}%</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--danger">
            <span>{t('cancellationFee')}</span>
            <strong>-{cancellationFee} {t('currency')}</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--strong">
            <span>{t('refunded')}</span>
            <strong>{refundedAmount} {t('currency')}</strong>
          </div>
        </div>

        <div className="cancel_booking_modal_refund_box">
          <span>{t('refundedToYou')}</span>
          <strong>{refundedAmount} {t('currency')}</strong>
        </div>

        {error && (
          <p className="text-danger small mb-2" role="alert">
            {error}
          </p>
        )}

        <div className="cancel_booking_modal_actions">
          <button
            type="button"
            className="cancel_booking_modal_confirm_btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t('cancelling') : t('confirm')}
          </button>

          <button type="button" className="cancel_booking_modal_back_btn" onClick={onClose}>
            {t('back')}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
