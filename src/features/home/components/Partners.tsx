'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';;

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';

import { SectionTitle } from '@/shared/ui/SectionTitle';
import type { Office } from '@/features/cars';

interface Props { offices: Office[]; }

export default function Partners({ offices }: Props) {
  const t = useTranslations();


  return (
    <section className="partners section py-20" id="partners">
      <div className="container-tcar">
        <SectionTitle
          smallTitle={t('partners.smallTitle')}
          title={t('partners.title')}
          subtitle={t('partners.subtitle')}
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
          className="partners_swiper mt-[50px] py-[15px]"
        >
          {offices.map((office) => (
            <SwiperSlide key={office.id}>
              <div className="partner_logo mx-auto flex h-[110px] w-full max-w-[220px] items-center justify-center rounded-2xl border border-stroke-light bg-surface-elevated transition duration-300 hover:-translate-y-1.5 hover:border-action-primary hover:shadow-[0_15px_35px_rgba(31,127,250,0.15)]">
                <Image src={office.logo} alt={office.name} width={140} height={70} className="h-auto max-h-[60px] w-auto max-w-[130px] opacity-70 transition duration-300 hover:scale-105 hover:opacity-100" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
