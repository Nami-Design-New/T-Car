'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { FiStar } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { useBookingActions } from '../hooks/useBookingActions';
const BookingReviewModal = dynamic(() => import('./BookingReviewModal'), { ssr: false });

interface Props {
  bookingId: string;
  pricePerDay: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  pointsUsed: number;
  total: number;
}
export default function BookingSidebar({
  bookingId,
  pricePerDay,
  days,
  subtotal,
  vatRate,
  vat,
  pointsUsed,
  total,
}: Props) {
  const t = useTranslations('myBookings.sidebar');
  const [showReview, setShowReview] = useState(false);
  const { submitting, review } = useBookingActions(bookingId);

  return (
    <aside className="booking-sidebar">
      <h3>{t('priceDetails')}</h3>

      <div className="price-row">
        <span className="value">{formatCurrency(pricePerDay)}</span>
        <span className="label">{t('price')}</span>
      </div>

      <div className="price-row">
        <span className="value">
          {formatCurrency(subtotal)}{' '}
          <small>
            {days} × {formatCurrency(pricePerDay)}
          </small>
        </span>
        <span className="label">{t('subtotal')}</span>
      </div>

      <div className="price-row">
        <span className="value">
          {formatCurrency(vat)} <small>{vatRate}%</small>
        </span>
        <span className="label">{t('vat')}</span>
      </div>
      <div className="price-row points">
        <span className="value">-{formatCurrency(pointsUsed)}</span>

        <span className="label">{t('points')}</span>
      </div>
      <div className="price-row total">
        <span className="value">{formatCurrency(total)}</span>
        <span className="label">{t('total')}</span>
      </div>

      <div className="sidebar-actions">
        <button className="primary-action" onClick={() => setShowReview(true)}>
          <FiStar size={16} />
          {t('review')}
        </button>
      </div>

      {showReview && (
        <BookingReviewModal
          submitting={submitting}
          onSubmit={review}
          onClose={() => setShowReview(false)}
        />
      )}
    </aside>
  );
}
