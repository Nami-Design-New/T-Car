'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiMoreVertical,
  FiEdit2,
  FiCalendar,
  FiX,
} from 'react-icons/fi';

import type { BookingStatus } from '@app-types/car';

interface Props {
  reference: string;
  statusLabel: string;
  status: BookingStatus;
}

export default function BookingDetailsHeader({
  reference,
  statusLabel,
  status,
}: Props) {
  const [showActions, setShowActions] = useState(false);

  const isActive =
    status === 'current' ||
    status === 'upcoming' ||
    status === 'late';

  return (
    <div className="booking-details-header">
      <Link
        href="/account?tab=bookings"
        className="back_link"
        aria-label="رجوع"
      >
        <FiArrowRight />
      </Link>

      <div className="booking-details-header-title">
        <h1>تفاصيل الحجز</h1>
        <span className="reference">#{reference}</span>
      </div>

      {isActive && (
        <div className="booking-actions">
          <button
            type="button"
            className="booking-actions-trigger"
            onClick={() => setShowActions((prev) => !prev)}
            aria-label="إجراءات الحجز"
            aria-expanded={showActions}
          >
            <FiMoreVertical />
          </button>

          {showActions && (
            <div className="booking-actions-menu">
              <button type="button">
                <FiEdit2 />
                <span>طلب تعديل</span>
              </button>

              <button type="button">
                <FiCalendar />
                <span>تمديد المدة</span>
              </button>

              <button
                type="button"
                className="danger"
              >
                <FiX />
                <span>إلغاء</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}