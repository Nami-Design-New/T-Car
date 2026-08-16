'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiStar, FiCalendar, FiMapPin, FiDroplet } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { CarListing } from '@app-types/car';
import Button from '../common/Button';
import BookingMonthlyModal from '../modals/BookingMonthlyModal';
import BookingDailyModal from '../modals/BookingDailyModal';

interface Props {
  car: CarListing;
}

export default function CityCarCard({ car }: Props) {
  const [bookingType, setBookingType] = useState<'monthly' | 'daily' | null>(null);

  const handleBookNow = () => {
    const type = new URLSearchParams(window.location.search).get('type');
    setBookingType(type === 'monthly' ? 'monthly' : 'daily');
  };

  return (
    <>
      <div className="city-car-card">
        {car.originalPrice && <span className="discount_badge">خصم خاص</span>}

        <Link href={`/cars/${car.id}`} className="city-car-card-image">
          <Image src={car.image} alt={car.name} fill sizes="350px" />
        </Link>

        <div className="city-car-card-content">
          <div className="title_row">
            <h3>{car.brand} {car.name}</h3>
            <div className="rate">
              <FiStar />
              {car.rating}
            </div>
          </div>

          <div className="car_meta">
            <span><FiCalendar />{car.year}</span>
            {/* <span><FiDroplet />{car.fuelType}</span> */}
            <span><FiMapPin />{car.showroom}</span>
          </div>

          <div className="price_row">
            <div>
              {car.originalPrice && (
                <span className="old_price">{formatCurrency(car.originalPrice)}</span>
              )}
              <h2>{formatCurrency(car.pricePerDay)}</h2>
              <small> / يوم</small>
            </div>

            <Button onClick={handleBookNow} className="book_now_btn">احجز الآن</Button>
          </div>
        </div>
      </div>

      {bookingType === 'monthly' && (
        <BookingMonthlyModal
          open
          onClose={() => setBookingType(null)}
          pricePerDay={car.pricePerDay}
          onConfirm={() => setBookingType(null)}
        />
      )}

      {bookingType === 'daily' && (
        <BookingDailyModal
          open
          onClose={() => setBookingType(null)}
          pricePerDay={car.pricePerDay}
          onConfirm={() => setBookingType(null)}
        />
      )}
    </>
  );
}
