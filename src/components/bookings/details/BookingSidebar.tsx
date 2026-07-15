'use client';

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import BookingReviewModal from '@components/modals/Bookingreviewmodal';

interface Props {
  reference: string;
  pricePerDay: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
}

export default function BookingSidebar({
  reference, pricePerDay, days, subtotal, vatRate, vat, total,
}: Props) {
  const [showReview, setShowReview] = useState(false);

  return (
    <aside className="booking-sidebar">
      <h3>تفاصيل السعر</h3>

      <div className="price-row">
        <span className="value">{formatCurrency(pricePerDay)}</span>
        <span className="label">السعر</span>
      </div>

      <div className="price-row">
        <span className="value">{formatCurrency(subtotal)} <small>{days} × {formatCurrency(pricePerDay)}</small></span>
        <span className="label">المجموع الفرعي</span>
      </div>

      <div className="price-row">
        <span className="value">{formatCurrency(vat)} <small>{vatRate}%</small></span>
        <span className="label">ضريبة القيمة المضافة</span>
      </div>

      <div className="price-row total">
        <span className="value">{formatCurrency(total)}</span>
        <span className="label">الإجمالي</span>
      </div>

      <div className="sidebar-actions">
        <button className="primary-action" onClick={() => setShowReview(true)}>
          <FiStar size={16} />
          تقييمك يهمنا
        </button>
      </div>

      {showReview && (
        <BookingReviewModal reference={reference} onClose={() => setShowReview(false)} />
      )}
    </aside>
  );
}
