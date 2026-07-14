'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiCalendar, FiMapPin, FiDroplet } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { CarListing } from '@app-types/car';

interface Props {
  car: CarListing;
}

export default function CityCarCard({ car }: Props) {
  return (
    <Link href={`/cars/${car.id}`} className="city-car-card">
      {car.originalPrice && <span className="discount_badge">خصم خاص</span>}

      <div className="city-car-card-image">
        <Image src={car.image} alt={car.name} fill sizes="350px" />
      </div>

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

          <span className="book_now_btn">احجز الآن</span>
        </div>
      </div>
    </Link>
  );
}