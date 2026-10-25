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
    <div className="car-quick-info mt-6">
      <div className="car-quick-info-top mb-3 flex items-center justify-between">
        <span className="car-quick-info-year inline-flex items-center rounded-full border border-stroke-light bg-surface-on-background px-3.5 py-1.5 text-sm font-semibold text-text-subtle">{t('modelYear', { year: car.year })}</span>

        {/* <button type="button" className="car-quick-info-rating" onClick={scrollToReviews}>
          <FiStar />
          <span>{car.rating}</span>
        </button> */}
      </div>

      <h1 className="car-quick-info-title m-0 text-[2rem] font-extrabold leading-[1.3] text-text-primary">
        {car.brand} {car.name}
      </h1>

      <div className="car-quick-info-facts mt-6 flex flex-wrap gap-3">
        <span className="fact showroom inline-flex items-center gap-2 rounded-full border border-stroke-light bg-surface-on-background px-4 py-2.5 text-sm font-semibold text-text-primary">
          <FiHome className="text-[17px] text-action-primary" /> {car.showroom}
        </span>

        {car.pickupPoint && (
          <span className="fact pickup inline-flex items-center gap-2 rounded-full border border-transparent bg-surface-card-primary px-4 py-2.5 text-sm font-semibold text-action-primary">
            {car.pickupPoint === 'airport' ? <LuPlane className="text-[17px] text-action-primary" /> : <MdTrain className="text-[17px] text-action-primary" />}
            {car.pickupPoint === 'airport' ? t('airportPickup') : t('stationPickup')}
          </span>
        )}

        {car.quickFacts.map((fact, i) => {
          const Icon = FACT_ICONS[fact.icon];
          return (
            <span key={i} className="fact inline-flex items-center gap-2 rounded-full border border-stroke-light bg-surface-on-background px-4 py-2.5 text-sm text-text-subtle">
              <Icon className="text-[17px] text-action-primary" /> {fact.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
