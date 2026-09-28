'use client';

import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';

import cancelBookingImage from '@/assets/icons/cancel_booking.svg';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;

  bookingAmount?: number;
  cancellationPercent?: number;
  cancellationFee?: number;
}

export default function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  bookingAmount = 2500,
  cancellationPercent = 25,
  cancellationFee = 1000,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const refundedAmount = bookingAmount - cancellationFee;

  return (
  
    <div className="modal_overlay" >
      <div className=" selection_modal cancel_booking_modal">
         {/* Close */}
        <button
          type="button"
          className="close_btn"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <FiX />
        </button>

        <div className="cancel_booking_modal_header">
          <h2>إلغاء الحجز</h2>
        </div>

        <div className="cancel_booking_modal_illustration">
          <Image src={cancelBookingImage} alt="إلغاء الحجز" width={140} height={110} />
        </div>

        <div className="cancel_booking_modal_question">
          <h3>هل أنت متأكد أنك تريد إلغاء الحجز؟</h3>
        </div>

        <div className="cancel_booking_modal_warning">
          <p>
            سوف يتم خصم {cancellationPercent}% من قيمة الحجز كرسوم للإلغاء،
            ويتم إعادة المبلغ المتبقي إليك.
          </p>
        </div>

        <div className="cancel_booking_modal_price_details">
          <h3 className="cancel_booking_modal_details_title">تفاصيل المبلغ</h3>

          <div className="cancel_booking_modal_row">
            <span>المبلغ المدفوع</span>
            <strong>{bookingAmount} ر.س</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--danger">
            <span>نسبة الخصم</span>
            <strong>{cancellationPercent}%</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--danger">
            <span>رسوم الإلغاء</span>
            <strong>-{cancellationFee} ر.س</strong>
          </div>

          <div className="cancel_booking_modal_row cancel_booking_modal_row--strong">
            <span>المبلغ المسترد</span>
            <strong>{refundedAmount} ر.س</strong>
          </div>
        </div>

        <div className="cancel_booking_modal_refund_box">
          <span>المبلغ المسترد إليك</span>
          <strong>{refundedAmount} ر.س</strong>
        </div>

        <div className="cancel_booking_modal_actions">
          <button type="button" className="cancel_booking_modal_confirm_btn" onClick={onConfirm}>
            تأكيد الإلغاء
          </button>

          <button type="button" className="cancel_booking_modal_back_btn" onClick={onClose}>
            تراجع
          </button>
        </div>
      </div>
    </div>
  );
}