'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (newDays: number) => void;
  currentDays?: number;
  pricePerDay?: number;
}

export default function ExtendDurationModal({
  open,
  onClose,
  onConfirm,
  currentDays = 1,
  pricePerDay = 500,
}: Props) {
  const [days, setDays] = useState(currentDays);

  useEffect(() => {
    setDays(currentDays);
  }, [currentDays, open]);

  if (!open) return null;

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
    <div className="modal_overlay">
      <div className="selection_modal extend_modal">

        {/* Close */}
        <button
          type="button"
          className="close_btn"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <FiX />
        </button>

        {/* Header */}
        <div className="modal_header">
          <h2>تمديد المدة</h2>
        </div>

        {/* Duration */}
        <div className="duration_picker">

          <p className="label">
            حدد عدد الأيام
          </p>

          <div className="picker_controls">

            <button
              type="button"
              className="plus"
              onClick={increment}
              aria-label="زيادة الأيام"
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
              aria-label="تقليل الأيام"
            >
              −
            </button>

          </div>

          <p className="note">
            تمديد ينتهي الحجز في 1 يناير 2025
          </p>

        </div>

        {/* Price Details */}
        <div className="price_details">

          <h3 className="details_title">
            تفاصيل السعر
          </h3>

          {/* السعر */}
          <div className="row">
            <span className="label">
              السعر
            </span>

            <span className="calculation">
            </span>

            <strong>
              {pricePerDay} ر.س
            </strong>
          </div>

          {/* المجموع الفرعي */}
          <div className="row">
            <span className="label">
              المجموع الفرعي
            </span>

            <span className="calculation">
              {days} × {pricePerDay}
            </span>

            <strong>
              {subtotal} ر.س
            </strong>
          </div>

          {/* غرامة التأخير */}
          <div className="row late_fee">
            <span className="label">
              غرامة التأخير
            </span>

            <span className="calculation">
              1 يوم
            </span>

            <strong>
              0 ر.س
            </strong>
          </div>

          {/* الضريبة */}
          <div className="row">
            <span className="label">
              ضريبة القيمة المضافة
            </span>

            <span className="calculation">
              5%
            </span>

            <strong>
              {vat} ر.س
            </strong>
          </div>

          {/* الإجمالي */}
          <div className="row total">
            <span className="label">
              الإجمالي
            </span>

            <span className="calculation">
            </span>

            <strong>
              {total} ر.س
            </strong>
          </div>

        </div>

        {/* Confirm */}
        <button
          type="button"
          className="confirm_btn"
          onClick={() => onConfirm(days)}
        >
          تأكيد
        </button>

      </div>
    </div>
  );
}