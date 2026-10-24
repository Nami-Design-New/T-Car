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
    <h2 className="office-row__title flex min-w-0 items-center gap-4" id={titleId}>
      <span className="office-row__logo grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border border-stroke-light bg-surface-on-background p-3" aria-hidden="true">
        <Image src={office.logo} alt="" width={56} height={56} className="h-full w-full object-contain" />
      </span>
      <span className="office-row__copy flex min-w-0 gap-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[1.35rem] font-extrabold leading-[1.35]">
        <span className="office-row__label text-action-primary">{t('office')}</span>
        <span className="office-row__name truncate text-text-primary">{office.name}</span>
      </span>
    </h2>
  );

  return (
    <section className={cn('office-row min-w-0', className)} aria-labelledby={titleId}>
      <header className="office-row__header mb-5 flex min-h-[82px] items-center gap-5 overflow-hidden">{title}</header>

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
        className="office-row__swiper min-w-0 px-0.5 pb-1.5 active:cursor-grabbing [&_.swiper-slide]:h-auto [&_.swiper-slide_.car-card]:h-full"
        breakpoints={{
          576: { slidesPerView: 2, spaceBetween: 18 },
          992: { slidesPerView: 3, spaceBetween: 20 },
        }}
      >
        {cars.map((car) => (
          <SwiperSlide key={car.id} className="office-row__slide !h-auto">
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
