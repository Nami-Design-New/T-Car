'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FiChevronRight } from 'react-icons/fi';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import CarCard from './CarCard';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import type { CarListing } from '../model';
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

  if (cars.length === 0) return null;

  return (
    <section className="section cars-rail pb-0 pt-12" id={id}>
      <div className="container-tcar">
        <div className="cars-rail-header mb-6 flex items-start justify-between gap-4 max-md:mb-3">
          <SectionTitle title={title} subtitle={subtitle} align="left" />

          <Link href={seeAllHref} className="cars-rail-see-all inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-stroke-light bg-surface-elevated px-[18px] font-semibold text-text-primary transition duration-300 hover:-translate-y-0.5 hover:border-action-primary hover:bg-action-primary hover:text-text-on-action hover:shadow-[0_10px_20px_rgba(31,127,250,0.18)] focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-3">
            {t('seeAll')}
            <FiChevronRight className="cars-rail-see-all-icon mirror-in-rtl text-xl transition duration-300" />
          </Link>
        </div>

        <Swiper
          modules={[Autoplay]}
          dir={isRTL ? 'rtl' : 'ltr'}
          slidesPerView="auto"
          spaceBetween={24}
          loop={cars.length > 3}
          speed={700}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="cars-rail-swiper w-full !overflow-hidden [&_.swiper-slide]:!h-auto"
        >
          {cars.map((car) => (
            <SwiperSlide key={car.id} className="cars-rail-item !h-auto !w-80 max-md:!w-[78vw]">
              <CarCard
                car={car}
                className="h-full"
                imageSizes="(max-width: 767px) 78vw, 340px"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
