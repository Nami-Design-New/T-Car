'use client';

import { useId } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import CarCard from './CarCard';
import type { CarListing, Office } from '../model';
import { cn } from '@/shared/lib/cn';
import { getDirection } from '@/shared/config/languages';
import { useCarouselRail } from '@/shared/hooks/useCarouselRail';

interface CarOfficeRowProps {
  office: Office;
  cars: CarListing[];
  className?: string;
}

export default function CarOfficeRow({ office, cars, className }: CarOfficeRowProps) {
  const t = useTranslations('officeRow');
  const locale = useLocale();
  const titleId = useId();
  const isRTL = getDirection(locale) === 'rtl';
  const { trackRef, pause, resume } = useCarouselRail({
    isRTL,
    autoplayInterval: 0,
    gap: 20,
  });

  if (cars.length === 0) return null;

  const title = (
    <h2 className="office-row__title" id={titleId}>
      <span className="office-row__logo" aria-hidden="true">
        <Image src={office.logo} alt="" width={56} height={56} />
      </span>
      <span className="office-row__copy">
        <span className="office-row__label">{t('office')}</span>
        <span className="office-row__name">{office.name}</span>
      </span>
    </h2>
  );

  return (
    <section className={cn('office-row', className)} aria-labelledby={titleId}>
      <header className="office-row__header">{title}</header>

      <div
        className="office-row__swiper"
        ref={trackRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {cars.map((car) => (
          <div key={car.id} className="office-row__slide">
            <CarCard
              car={car}
              imageSizes="(max-width: 575px) 84vw, (max-width: 991px) 44vw, 300px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
