import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiHome, FiCalendar } from 'react-icons/fi';
import type { UserBooking } from '@app-types/car';

interface Props {
  booking: UserBooking;
}

export default function BookingCard({ booking }: Props) {
  return (
    <Link href={`/my-bookings/${booking.id}`} className="booking-card">
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

        <span className="booking-card-year">موديل {booking.year}</span>

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