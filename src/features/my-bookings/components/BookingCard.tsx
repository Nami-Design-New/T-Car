import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { FiStar, FiHome, FiCalendar } from 'react-icons/fi';
import type { UserBooking } from '../model';

interface Props {
  booking: UserBooking;
}

export default function BookingCard({ booking }: Props) {
  const t = useTranslations('myBookings');
  return (
    <Link href={`/account/bookings/${booking.id}`} className="booking-card">
      <div className="booking-card-image">
        <Image src={booking.carImage} alt={booking.carName} fill sizes="(max-width: 768px) 100vw, 320px" />

        <span className={`booking-card-status ${booking.status}`}>
          {booking.statusLabel}
        </span>
      </div>

      <div className="booking-card-body">
        <div className="booking-card-title-row">
          <h4>{booking.carBrand} {booking.carName}</h4>
          <span className="booking-card-rating">
            <FiStar /> {booking.rating}
          </span>
        </div>

        <span className="booking-card-year">{t('modelYear', { year: booking.year })}</span>

        <div className="booking-card-meta">
          <span>
            <FiHome /> {booking.showroom}
          </span>
          <span>
            <FiCalendar /> {booking.dateLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
