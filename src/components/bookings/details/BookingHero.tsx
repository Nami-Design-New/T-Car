import Image from 'next/image';
import { FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { StaticImageData } from 'next/image';
import type { BookingStatus } from '@app-types/car';

interface Props {
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;

  pricePerDay: number;
  originalPrice?: number;

  status: BookingStatus;
  statusLabel: string;

  pickupDateTime: string;
  dropoffDateTime: string;
}

function formatDateTime(dateTime: string) {
  const date = new Date(dateTime);

  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function BookingHero({
  carName,
  carBrand,
  carImage,
  showroom,
  pricePerDay,
  originalPrice,
  status,
  statusLabel,
  dropoffDateTime,
}: Props) {
  const bookingDate = formatDateTime(dropoffDateTime);

  return (
    <div className="booking-hero">
      <div className="booking-hero-image">
        <Image
          src={carImage}
          alt={carName}
          fill
          sizes="(max-width: 860px) 100vw, 340px"
        />
      </div>

      <div className="booking-hero-body">
        <span className="showroom">
          <FiMapPin size={14} />
          {showroom}
        </span>

        <h2>
          {carBrand} {carName}
        </h2>

        <div className={`booking-status ${status}`}>
          <span className="status-label">
            {statusLabel}
          </span>

          <span className="status-date">
            {bookingDate}
          </span>
        </div>

        <div className="price-block">
          {originalPrice && (
            <span className="old">
              {formatCurrency(originalPrice)}
            </span>
          )}

          <span className="current">
            {formatCurrency(pricePerDay)}
            <small>/يوم</small>
          </span>
        </div>
      </div>
    </div>
  );
}