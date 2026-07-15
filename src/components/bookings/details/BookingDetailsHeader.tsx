
'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

import type { BookingStatus } from '@app-types/car';

interface Props {
  reference: string;
  statusLabel: string;
  status: BookingStatus;
}

export default function BookingDetailsHeader({ reference, statusLabel, status }: Props) {
  return (
    <div className="booking-details-header">
      <Link href="/account?tab=bookings" className="back_link" aria-label="رجوع">
        <FiArrowRight />
      </Link>

      <div className="booking-details-header-title">
        <h1>تفاصيل الحجز</h1>
        <span className="reference">#{reference}</span>
      </div>

      <span className={`booking-details-status ${status}`}>{statusLabel}</span>
    </div>
  );
}
