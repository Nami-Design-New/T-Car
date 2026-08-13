'use client';

import { useState } from 'react';

import type { UserBooking, BookingTab } from '@app-types/car';

import BookingsTabs from '@components/bookings/BookingsTabs';
import BookingCard from '@components/bookings/BookingCard';
import BookingsEmptyState from '@components/bookings/BookingsEmptyState';

interface Props {
  bookings: UserBooking[];
}

const ACTIVE_STATUSES = ['current', 'upcoming', 'late'] as const;
const PAST_STATUSES = ['completed', 'cancelled'] as const;

export default function BookingsTab({ bookings }: Props) {
  const [tab, setTab] = useState<BookingTab>('active');

  const activeBookings = bookings.filter((booking) =>
    ACTIVE_STATUSES.includes(
      booking.status as (typeof ACTIVE_STATUSES)[number]
    )
  );

  const pastBookings = bookings.filter((booking) =>
    PAST_STATUSES.includes(
      booking.status as (typeof PAST_STATUSES)[number]
    )
  );

  const filtered = tab === 'active' ? activeBookings : pastBookings;

  const emptyMessage =
    tab === 'active'
      ? 'لا توجد حجوزات حالية'
      : 'لا توجد حجوزات سابقة';

  return (
    <div>
      <BookingsTabs
        active={tab}
        onChange={setTab}
        activeCount={activeBookings.length}
        pastCount={pastBookings.length}
      />

      {filtered.length === 0 ? (
        <BookingsEmptyState message={emptyMessage} />
      ) : (
        <div className="bookings-grid">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
            />
          ))}
        </div>
      )}
    </div>
  );
}