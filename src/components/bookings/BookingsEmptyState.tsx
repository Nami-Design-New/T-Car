'use client';

import Link from 'next/link';
import Lottie from 'lottie-react';

import emptyBookingsAnimation from '@assets/images/non_data.json';

interface Props {
  message: string;
}

export default function BookingsEmptyState({
  message,
}: Props) {
  return (
    <div className="bookings-empty">
      <div className="bookings-empty-animation">
        <Lottie
          animationData={emptyBookingsAnimation}
          loop
        />
      </div>

      <h3>لا توجد حجوزات</h3>

      <p>{message}</p>

      <Link
        href="/cities"
        className="btn btn-primary btn-md"
      >
        <span>ابدأ حجزًا جديدًا</span>
      </Link>
    </div>
  );
}