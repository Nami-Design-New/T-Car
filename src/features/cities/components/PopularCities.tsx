"use client";

import { useLocale, useTranslations } from "next-intl";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { getDirection } from "@/shared/config/languages";
import { useCarouselRail } from "@/shared/hooks/useCarouselRail";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { City } from "../model";
import CityCard from "./CityCard";

interface Props {
  cities: City[];
}

export default function PopularCities({ cities }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = getDirection(locale) === "rtl";
  const {
    trackRef,
    scrollPrev,
    scrollNext,
    pause: stopAutoplay,
    resume: startAutoplay,
  } = useCarouselRail({ isRTL });

  return (
    <section className="relative pt-30 max-md:pt-10" id="cities">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mb-6 flex items-center justify-between gap-4 max-md:mb-4">
          <SectionTitle align="left" title={t("popularCities.title")} />
          <div className="flex shrink-0 gap-3 max-md:gap-2">
            <button
              type="button"
              aria-label="previous"
              onClick={scrollPrev}
              className="border-stroke-light bg-surface-elevated text-text-primary hover:border-action-primary hover:bg-action-primary hover:text-text-on-action flex size-11 items-center justify-center rounded-full border transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(31,127,250,0.18)] max-md:size-10"
            >
              <FiArrowLeft className="rtl:scale-x-[-1]" />
            </button>
            <button
              type="button"
              aria-label="next"
              onClick={scrollNext}
              className="border-stroke-light bg-surface-elevated text-text-primary hover:border-action-primary hover:bg-action-primary hover:text-text-on-action flex size-11 items-center justify-center rounded-full border transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(31,127,250,0.18)] max-md:size-10"
            >
              <FiArrowRight className="rtl:scale-x-[-1]" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          dir={isRTL ? "rtl" : "ltr"}
          className="scrollbar:none flex [scroll-snap-type:x_mandatory] gap-6 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        >
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}
