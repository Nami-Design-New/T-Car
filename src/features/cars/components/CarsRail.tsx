'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FiChevronRight } from 'react-icons/fi';

import CarCard from './CarCard';
import SectionTitle from '@/shared/ui/SectionTitle';
import type { CarListing } from '../model';
import { useCarouselRail } from '@/shared/hooks/useCarouselRail';
import { Link } from '@/i18n/navigation';
import { getDirection } from '@/shared/config/languages';

interface CarsRailProps {
  id: string;
  title: string;
  subtitle?: string;
  cars: CarListing[];
  seeAllHref?: string;
}

export default function CarsRail({
  id,
  title,
  subtitle,
  cars,
  seeAllHref = '/cars',
}: CarsRailProps) {
  const t = useTranslations('carSections');
  const locale = useLocale();
  const isRTL = getDirection(locale) === 'rtl';

  const { trackRef, pause, resume } = useCarouselRail({ isRTL });

  if (cars.length === 0) return null;

  return (
    <section className="section cars-rail" id={id}>
      <div className="container-tcar">
        <div className="cars-rail-header">
          <SectionTitle title={title} subtitle={subtitle} align="left" />

          <Link href={seeAllHref} className="cars-rail-see-all">
            {t('seeAll')}
            <FiChevronRight className="cars-rail-see-all-icon mirror-in-rtl" />
          </Link>
        </div>

        <div
          className="cars-rail-track"
          ref={trackRef}
          onMouseEnter={pause}
          onMouseLeave={resume}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              className="cars-rail-item"
              imageSizes="(max-width: 767px) 78vw, 340px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
