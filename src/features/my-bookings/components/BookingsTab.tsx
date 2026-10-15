import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { splitBookings, type BookingTab, type UserBooking } from '../model';
import BookingsTabs from './BookingsTabs';
import BookingCard from './BookingCard';

interface Props {
  bookings: UserBooking[];
  /** From the URL (?status=); the page parses it. */
  status: BookingTab;
}

/** Server-rendered: the status comes from the URL, so no client state is needed. */
export default function BookingsTab({ bookings, status }: Props) {
  const t = useTranslations('bookings.empty');

  const { active, past } = splitBookings(bookings);
  const filtered = status === 'active' ? active : past;

  return (
    <div>
      <BookingsTabs active={status} activeCount={active.length} pastCount={past.length} />

      {filtered.length === 0 ? (
        <EmptyState
          title={t('title')}
          description={t(status)}
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
