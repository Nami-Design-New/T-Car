'use client';

import { FiStar, FiHome, FiShield, FiTruck, FiMapPin } from 'react-icons/fi';
import type { CarDetails } from '@app-types/car';

const FACT_ICONS = { shield: FiShield, delivery: FiTruck, distance: FiMapPin };

interface Props {
  car: CarDetails;
}

export default function CarQuickInfo({ car }: Props) {
  const scrollToReviews = () => {
    document.getElementById('reviews-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="car-quick-info">
      <div className="car-quick-info-top">
        <span className="car-quick-info-year">موديل {car.year}</span>

        <button type="button" className="car-quick-info-rating" onClick={scrollToReviews}>
          <FiStar />
          <span>{car.rating}</span>
        </button>
      </div>

      <h1 className="car-quick-info-title">{car.brand} {car.name}</h1>

      <div className="car-quick-info-facts">
        <span className="fact showroom">
          <FiHome /> {car.showroom}
        </span>

        {car.quickFacts.map((fact, i) => {
          const Icon = FACT_ICONS[fact.icon];
          return (
            <span key={i} className="fact">
              <Icon /> {fact.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}