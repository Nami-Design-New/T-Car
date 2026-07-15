'use client';

import { useState } from 'react';

import type { UserBooking, BookingStatus } from '@app-types/car';

import BookingsTabs from '@components/bookings/BookingsTabs';
import BookingCard from '@components/bookings/BookingCard';
import BookingsEmptyState from '@components/bookings/BookingsEmptyState';

interface Props {
  bookings: UserBooking[];
}

export default function BookingsTab({ bookings }: Props) {
  const [tab, setTab] = useState<BookingStatus>('active');

  const activeBookings = bookings.filter(
    (b) => b.status === 'active'
  );

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'upcoming'
  );

  const completedBookings = bookings.filter(
    (b) => b.status === 'completed'
  );

  const filtered =
    tab === 'active'
      ? activeBookings
      : tab === 'upcoming'
      ? upcomingBookings
      : completedBookings;

  const emptyMessage =
    tab === 'active'
      ? 'لا توجد حجوزات حالية'
      : tab === 'upcoming'
      ? 'لا توجد حجوزات قادمة'
      : 'لا توجد حجوزات مكتملة';

  return (
    <div>
      <BookingsTabs
        active={tab}
        onChange={setTab}
        activeCount={activeBookings.length}
        upcomingCount={upcomingBookings.length}
        completedCount={completedBookings.length}
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