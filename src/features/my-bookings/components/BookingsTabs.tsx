import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { bookingsListPath, type BookingTab } from '../model';
import './BookingsTabs.scss';

interface Props {
  active: BookingTab;
  activeCount: number;
  pastCount: number;
}

const TABS: { id: BookingTab; label: string }[] = [
  { id: 'active', label: 'active' },
  { id: 'past', label: 'past' },
];

/**
 * Current / past bookings as links to ?status= (doc 5): the list is a view of
 * the same data, so it lives in the URL, survives a refresh, and the details
 * page can link back to the right list.
 */
export default function BookingsTabs({ active, activeCount, pastCount }: Props) {
  const t = useTranslations('myBookings.tabs');
  const counts: Record<BookingTab, number> = { active: activeCount, past: pastCount };

  return (
    <nav className="bookings-tabs" aria-label={t('title')}>
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={bookingsListPath(id)}
          className={active === id ? 'active' : ''}
          aria-current={active === id ? 'page' : undefined}
          // A filter of the same page: no new scroll position.
          scroll={false}
        >
          {t(label)}
          <span className="count">{counts[id]}</span>
        </Link>
      ))}
    </nav>
  );
}
