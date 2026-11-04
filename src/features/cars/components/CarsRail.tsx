"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import CarCard from "./CarCard";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { CarListing } from "../model";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/shared/config/languages";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";
import { ErrorState } from "@/shared/ui/ErrorState";
import CarCardSkeleton from "./CarCardSkeleton";
const chevronLeft = ICONS.chevronLeft;
interface CarsRailProps {
  id: string;
  title: string;
  subtitle?: string;
  cars: CarListing[];
  seeAllHref?: string;
  /** Disables looping so reaching the final slide can request another page. */
  paginated?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadError?: unknown;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onSelectCar?: (car: CarListing) => void;
}

export default function CarsRail({
  id,
  title,
  subtitle,
  cars,
  seeAllHref = "/cars",
  paginated = false,
  hasMore = false,
  loadingMore = false,
  loadError,
  onLoadMore,
  onRetry,
  onSelectCar,
}: CarsRailProps) {
  const t = useTranslations("carSections");
  const locale = useLocale();
  const isRTL = getDirection(locale) === "rtl";

  const wasDragging = useRef(false);
  const paginationGestureStarted = useRef(false);
  const paginationLoadRequested = useRef(false);

  useEffect(() => {
    if (!loadingMore) paginationLoadRequested.current = false;
  }, [loadingMore]);

  const loadNextPage = () => {
    if (
      paginationLoadRequested.current ||
      !hasMore ||
      loadingMore ||
      loadError
    ) {
      return;
    }
    paginationLoadRequested.current = true;
    onLoadMore?.();
  };

  if (cars.length === 0 && !loadingMore && !loadError) return null;

  return (
    <section className="pt-12 pb-0 lg:pt-24" id={id}>
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mb-6 flex items-center justify-between gap-4 max-md:mb-3">
          <SectionTitle title={title} align="left" />

          <Link
            href={seeAllHref}
            className="group text-text-subtle focus-visible:outline-action-primary/20 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-0 font-normal transition duration-300 focus-visible:outline-3 focus-visible:outline-offset-3 max-md:min-h-10 max-md:text-sm"
          >
            {t("seeAll")}
            <Image
              src={chevronLeft.src}
              alt=""
              className="scale-x-[-1] rtl:scale-x-100"
              width={chevronLeft.width}
              height={chevronLeft.height}
            />
            {/* <FiChevronRight className="cars-rail-see-all-icon rtl:scale-x-[-1] text-xl max-md:text-lg transition duration-300 group-hover:me-0.5" /> */}
          </Link>
        </div>

        <Swiper
          onTouchStart={() => {
            wasDragging.current = false;
            paginationGestureStarted.current = false;
          }}
          onSliderMove={() => {
            wasDragging.current = true;
            paginationGestureStarted.current = true;
          }}
          onTouchEnd={(swiper) => {
            // A one-card page cannot move far enough to emit `onReachEnd` on
            // narrow screens. A deliberate swipe from that card still means
            // the visitor has reached the rail's end.
            if (
              paginated &&
              swiper.slides.length === 1 &&
              paginationGestureStarted.current &&
              hasMore
            ) {
              loadNextPage();
            }
            window.setTimeout(() => {
              wasDragging.current = false;
            });
          }}
          onReachEnd={() => {
            if (
              paginationGestureStarted.current &&
              hasMore
            ) {
              loadNextPage();
            }
          }}
          dir={isRTL ? "rtl" : "ltr"}
          slidesPerView="auto"
          spaceBetween={24}
          loop={paginated ? false : cars.length > 3}
          speed={700}
          className="cars-rail-swiper w-full overflow-hidden! [&_.swiper-slide]:h-auto!"
        >
          {cars.map((car) => (
            <SwiperSlide
              key={car.id}
              className="cars-rail-item h-auto! w-80! max-md:w-[78vw]!"
            >
              <CarCard
                car={car}
                onSelect={
                  car.availability && onSelectCar
                    ? (selectedCar) => {
                        if (!wasDragging.current) onSelectCar(selectedCar);
                      }
                    : undefined
                }
                className="h-full"
                imageSizes="(max-width: 767px) 78vw, 340px"
              />
            </SwiperSlide>
          ))}
          {loadingMore && (
            <SwiperSlide
              className="cars-rail-item h-auto! w-80! max-md:w-[78vw]!"
              aria-busy="true"
            >
              <CarCardSkeleton />
            </SwiperSlide>
          )}
          {Boolean(loadError) && (
            <SwiperSlide className="cars-rail-item h-auto! w-80! max-md:w-[78vw]!">
              <ErrorState error={loadError} onRetry={onRetry} size="inline" />
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </section>
  );
}
