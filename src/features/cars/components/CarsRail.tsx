"use client";

import { useLocale, useTranslations } from "next-intl";
import { FiChevronRight } from "react-icons/fi";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import CarCard from "./CarCard";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { CarListing } from "../model";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/shared/config/languages";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";
const chevronLeft = ICONS.chevronLeft;
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
  seeAllHref = "/cars",
}: CarsRailProps) {
  const t = useTranslations("carSections");
  const locale = useLocale();
  const isRTL = getDirection(locale) === "rtl";

  if (cars.length === 0) return null;

  return (
    <section className="pt-12 pb-0" id={id}>
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
              width={chevronLeft.width}
              height={chevronLeft.height}
            />
            {/* <FiChevronRight className="cars-rail-see-all-icon rtl:scale-x-[-1] text-xl max-md:text-lg transition duration-300 group-hover:me-0.5" /> */}
          </Link>
        </div>

        <Swiper
          modules={[Autoplay]}
          dir={isRTL ? "rtl" : "ltr"}
          slidesPerView="auto"
          spaceBetween={24}
          loop={cars.length > 3}
          speed={700}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="cars-rail-swiper w-full overflow-hidden! [&_.swiper-slide]:h-auto!"
        >
          {cars.map((car) => (
            <SwiperSlide
              key={car.id}
              className="cars-rail-item h-auto! w-80! max-md:w-[78vw]!"
            >
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
