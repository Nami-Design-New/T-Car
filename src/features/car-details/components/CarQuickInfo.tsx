'use client';

import { FiStar, FiHome, FiShield, FiTruck, FiMapPin } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { LuPlane } from 'react-icons/lu';
import { MdTrain } from 'react-icons/md';
import type { CarDetails } from '../model';

const FACT_ICONS = { shield: FiShield, delivery: FiTruck, distance: FiMapPin };

interface Props {
  car: CarDetails;
}

export default function CarQuickInfo({ car }: Props) {
  const t = useTranslations('carDetails');
  const scrollToReviews = () => {
    document
      .getElementById('reviews-summary')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="car-quick-info">
      <div className="car-quick-info-top">
        <span className="car-quick-info-year">{t('modelYear', { year: car.year })}</span>

        {/* <button type="button" className="car-quick-info-rating" onClick={scrollToReviews}>
          <FiStar />
          <span>{car.rating}</span>
        </button> */}
      </div>

      <h1 className="car-quick-info-title">
        {car.brand} {car.name}
      </h1>

      <div className="car-quick-info-facts">
        <span className="fact showroom">
          <FiHome /> {car.showroom}
        </span>

        {car.pickupPoint && (
          <span className="fact pickup">
            {car.pickupPoint === 'airport' ? <LuPlane /> : <MdTrain />}
            {car.pickupPoint === 'airport' ? t('airportPickup') : t('stationPickup')}
          </span>
        )}

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
