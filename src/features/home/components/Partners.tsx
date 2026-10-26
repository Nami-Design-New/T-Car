"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { Office } from "@/features/cars";

interface Props {
  offices: Office[];
}

export default function Partners({ offices }: Props) {
  const t = useTranslations();

  return (
    <section className="pt-12" id="partners">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle
          title={t("partners.title")}
          subtitle={t("partners.subtitle")}
        />

        <Swiper
          modules={[Autoplay]}
          loop
          speed={3500}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          spaceBetween={24}
          breakpoints={{
            0: {
              slidesPerView: 2,
            },
            576: {
              slidesPerView: 3,
            },
            768: {
              slidesPerView: 4,
            },
            992: {
              slidesPerView: 5,
            },
            1200: {
              slidesPerView: 6,
            },
          }}
          className="mt-8 py-3.75 md:mt-12.5"
        >
          {offices.map((office) => (
            <SwiperSlide key={office.id}>
              <div className="bg-primary-100 hover:border-action-primary mx-auto flex h-27.5 w-full max-w-55 items-center justify-center rounded-md transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(31,127,250,0.15)]">
                <Image
                  src={office.logo}
                  alt={office.name}
                  width={140}
                  height={70}
                  className="h-auto max-h-15 w-auto max-w-32.5 opacity-70 transition duration-300 hover:scale-105 hover:opacity-100"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
