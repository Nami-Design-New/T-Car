'use client';

import { useState } from 'react';
import { splitBookings, type BookingTab, type UserBooking } from '../model';
import BookingsTabs from './BookingsTabs';
import BookingCard from './BookingCard';
import BookingsEmptyState from './BookingsEmptyState';

interface Props {
  bookings: UserBooking[];
}

export default function BookingsTab({ bookings }: Props) {
  const [tab, setTab] = useState<BookingTab>('active');

  const { active, past } = splitBookings(bookings);
  const filtered = tab === 'active' ? active : past;
  const emptyMessage = tab === 'active' ? 'لا توجد حجوزات حالية' : 'لا توجد حجوزات سابقة';

  return (
    <div>
      <BookingsTabs
        active={tab}
        onChange={setTab}
        activeCount={active.length}
        pastCount={past.length}
      />

      {filtered.length === 0 ? (
        <BookingsEmptyState message={emptyMessage} />
      ) : (
        <div className="bookings-grid">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
