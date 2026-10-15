'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';

import CarCard from './CarCard';
import type { CarListing, Office } from '../model';
import { cn } from '@/shared/lib/cn';

interface CarOfficeRowProps {
  office: Office;
  cars: CarListing[];
  className?: string;
}

interface NavState {
  /** No overflow: the slides all fit, so arrow controls would be dead. */
  isLocked: boolean;
  isBeginning: boolean;
  isEnd: boolean;
}

const LOCKED: NavState = { isLocked: true, isBeginning: true, isEnd: true };

// Swiper derives direction from the `dir` it inherits, so RTL needs no prop
// here -- only the arrow icons have to be mirrored in JSX.
export default function CarOfficeRow({ office, cars, className }: CarOfficeRowProps) {
  const t = useTranslations('officeRow');
  const titleId = useId();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [nav, setNav] = useState<NavState>(LOCKED);

  if (cars.length === 0) return null;

  const syncNav = (swiper: SwiperInstance) => {
    setNav({
      isLocked: swiper.isLocked,
      isBeginning: swiper.isBeginning,
      isEnd: swiper.isEnd,
    });
  };

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

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncNav(swiper);
        }}
        onInit={syncNav}
        onSlideChange={syncNav}
        onResize={syncNav}
        onLock={syncNav}
        onUnlock={syncNav}
        slidesPerView={1.12}
        spaceBetween={14}
        speed={500}
        grabCursor={!nav.isLocked}
        watchOverflow
        className="office-row__swiper"
        breakpoints={{
          576: { slidesPerView: 2, spaceBetween: 18 },
          992: { slidesPerView: 3, spaceBetween: 20 },
        }}
      >
        {cars.map((car) => (
          <SwiperSlide key={car.id} className="office-row__slide">
            <CarCard
              car={car}
              imageSizes="(max-width: 575px) 84vw, (max-width: 991px) 44vw, 300px"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
