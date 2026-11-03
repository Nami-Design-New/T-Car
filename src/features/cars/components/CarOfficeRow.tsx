"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import { cn } from "@/shared/lib/cn";
import { ErrorState } from "@/shared/ui/ErrorState";
import type { CarListing, Office } from "../model";
import CarCard from "./CarCard";
import CarCardSkeleton from "./CarCardSkeleton";

interface CarOfficeRowProps {
  office: Office;
  cars: CarListing[];
  className?: string;
  /** Another page of cars exists; reaching the row's end loads it. */
  hasMore?: boolean;
  /** A next page is loading: a skeleton slide follows the cars. */
  loadingMore?: boolean;
  /** The next page failed: a retry slide follows the cars. */
  loadError?: unknown;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onSelectCar?: (car: CarListing) => void;
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
export default function CarOfficeRow({
  office,
  cars,
  className,
  hasMore = false,
  loadingMore = false,
  loadError,
  onLoadMore,
  onRetry,
  onSelectCar,
}: CarOfficeRowProps) {
  const t = useTranslations("officeRow");
  const titleId = useId();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const wasDragging = useRef(false);
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
    <h2
      className="office-row__title flex min-w-0 items-center gap-4"
      id={titleId}
    >
      <span
        className="office-row__logo border-stroke-light bg-surface-on-background grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border p-3"
        aria-hidden="true"
      >
        <Image
          src={office.logo}
          alt=""
          width={56}
          height={56}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="office-row__copy flex min-w-0 gap-0.5 overflow-hidden text-[1.35rem] leading-[1.35] font-extrabold text-ellipsis whitespace-nowrap">
        <span className="office-row__label text-action-primary">
          {t("office")}
        </span>
        <span className="office-row__name text-text-primary truncate">
          {office.name}
        </span>
      </span>
    </h2>
  );

  return (
    <section className={cn("min-w-0", className)} aria-labelledby={titleId}>
      <header className="mb-5 flex min-h-20.5 items-center gap-5 overflow-hidden max-md:min-h-18 max-md:flex-wrap max-md:gap-3 max-md:p-4">
        {title}
      </header>

      <Swiper
        onTouchStart={() => {
          wasDragging.current = false;
        }}
        onSliderMove={() => {
          wasDragging.current = true;
        }}
        onTouchEnd={() => {
          // Let the click that follows a touch end see the drag state first.
          window.setTimeout(() => {
            wasDragging.current = false;
          });
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncNav(swiper);
        }}
        onInit={syncNav}
        onSlideChange={syncNav}
        onReachEnd={() => {
          if (hasMore && !loadingMore && !loadError) onLoadMore?.();
        }}
        onResize={syncNav}
        onLock={syncNav}
        onUnlock={syncNav}
        slidesPerView={1.12}
        spaceBetween={14}
        speed={500}
        grabCursor={!nav.isLocked}
        watchOverflow
        className="min-w-0 px-0.5 pb-1.5 active:cursor-grabbing [&_.swiper-slide]:h-auto [&_.swiper-slide_.car-card]:h-full"
        breakpoints={{
          576: { slidesPerView: 2, spaceBetween: 18 },
          992: { slidesPerView: 3, spaceBetween: 20 },
        }}
      >
        {cars.map((car) => (
          <SwiperSlide key={car.id} className="h-auto!">
            <CarCard
              car={car}
              onSelect={
                onSelectCar
                  ? (selectedCar) => {
                      if (!wasDragging.current) onSelectCar(selectedCar);
                    }
                  : undefined
              }
              imageSizes="(max-width: 575px) 84vw, (max-width: 991px) 44vw, 300px"
            />
          </SwiperSlide>
        ))}
        {loadingMore && (
          <SwiperSlide className="office-row__slide h-auto!" aria-busy="true">
            <CarCardSkeleton />
          </SwiperSlide>
        )}
        {Boolean(loadError) && (
          <SwiperSlide className="office-row__slide h-auto!">
            <div className="grid h-full place-items-center">
              <ErrorState error={loadError} onRetry={onRetry} size="inline" />
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </section>
  );
}
