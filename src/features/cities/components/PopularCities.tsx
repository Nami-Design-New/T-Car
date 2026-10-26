"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { FiArrowLeft, FiArrowRight, FiMapPin } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/shared/config/languages";
import { useCarouselRail } from "@/shared/hooks/useCarouselRail";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { City } from "../model";

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
            <Link
              key={city.id}
              href={`/cities/${city.slug}`}
              className="group relative block h-65 w-[320px] shrink-0 snap-start overflow-hidden rounded-md no-underline max-md:h-55 max-md:w-[78vw]"
            >
              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width:768px) 80vw,320px"
                className="object-cover transition-transform duration-600 group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,30,30,0.75)_0%,rgba(30,30,30,0.25)_55%,rgba(30,30,30,0)_100%)]" />
              <span className="bg-text-on-brand/15 text-text-on-brand absolute inset-s-4 top-4 z-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold backdrop-blur-[10px]">
                <FiMapPin aria-hidden="true" />
                {city.carsAvailable} {t("popularCities.carsAvailable")}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5.5">
                <h3 className="text-text-on-brand m-0 text-[1.35rem] font-bold">
                  {city.name}
                </h3>
                <span className="text-text-on-brand inline-flex items-center gap-1.5 text-[0.95rem] font-semibold">
                  {t("popularCities.explore")}
                  <FiArrowRight className="transition-[margin-inline-end] duration-300 group-hover:me-1.25 rtl:scale-x-[-1]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
