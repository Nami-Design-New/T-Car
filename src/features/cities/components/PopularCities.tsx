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
    <section className="relative pt-[120px] pb-10" id="cities">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <div className="mb-6 flex items-start justify-between max-md:mb-0">
          <SectionTitle
            title={t("popularCities.title")}
            subtitle={t("popularCities.subtitle")}
          />
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              aria-label="previous"
              onClick={scrollPrev}
              className="flex size-11 items-center justify-center rounded-full border border-stroke-light bg-surface-elevated text-text-primary transition duration-300 hover:-translate-y-0.5 hover:border-action-primary hover:bg-action-primary hover:text-text-on-action hover:shadow-[0_10px_20px_rgba(31,127,250,0.18)]"
            >
              <FiArrowLeft className="rtl:scale-x-[-1]" />
            </button>
            <button
              type="button"
              aria-label="next"
              onClick={scrollNext}
              className="flex size-11 items-center justify-center rounded-full border border-stroke-light bg-surface-elevated text-text-primary transition duration-300 hover:-translate-y-0.5 hover:border-action-primary hover:bg-action-primary hover:text-text-on-action hover:shadow-[0_10px_20px_rgba(31,127,250,0.18)]"
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
          className="flex gap-6 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/cities/${city.slug}`}
              className="group relative block h-[260px] w-[320px] shrink-0 snap-start overflow-hidden rounded-md no-underline max-md:h-[220px] max-md:w-[78vw]"
            >
              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width:768px) 80vw,320px"
                className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,30,30,0.75)_0%,rgba(30,30,30,0.25)_55%,rgba(30,30,30,0)_100%)]" />
              <span className="absolute start-4 top-4 z-[2] inline-flex items-center gap-1.5 rounded-full bg-text-on-brand/[0.15] px-3 py-1.5 text-sm font-semibold text-text-on-brand backdrop-blur-[10px]">
                <FiMapPin aria-hidden="true" />
                {city.carsAvailable} {t("popularCities.carsAvailable")}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-[22px]">
                <h3 className="m-0 text-[1.35rem] font-bold text-text-on-brand">
                  {city.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-text-on-brand">
                  {t("popularCities.explore")}
                  <FiArrowRight className="rtl:scale-x-[-1] transition-[margin-inline-end] duration-300 group-hover:me-[5px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
