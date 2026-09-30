'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { splitBookings, type BookingTab, type UserBooking } from '../model';
import BookingsTabs from './BookingsTabs';
import BookingCard from './BookingCard';

interface Props {
  bookings: UserBooking[];
}

export default function BookingsTab({ bookings }: Props) {
  const t = useTranslations('bookings.empty');
  const [tab, setTab] = useState<BookingTab>('active');

  const { active, past } = splitBookings(bookings);
  const filtered = tab === 'active' ? active : past;

  return (
    <div>
      <BookingsTabs
        active={tab}
        onChange={setTab}
        activeCount={active.length}
        pastCount={past.length}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={t('title')}
          description={t(tab)}
          action={
            <Button asChild>
              <Link href="/cities">{t('cta')}</Link>
            </Button>
          }
        />
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
