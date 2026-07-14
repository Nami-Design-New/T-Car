'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';

import SectionTitle from '@components/common/SectionTitle';

import b1 from '@assets/images/b1.webp';
import b2 from '@assets/images/b2.webp';
import b3 from '@assets/images/b3.webp';
import b4 from '@assets/images/b4.webp';
import b5 from '@assets/images/b5.webp';
import b6 from '@assets/images/b6.webp';
import b7 from '@assets/images/b7.webp';
import b8 from '@assets/images/b8.webp';

const logos = [
  { image: b1, name: 'Toyota' },
  { image: b2, name: 'BMW' },
  { image: b3, name: 'Audi' },
  { image: b4, name: 'Mercedes' },
  { image: b5, name: 'KIA' },
  { image: b6, name: 'Hyundai' },
  { image: b7, name: 'Nissan' },
  { image: b8, name: 'Lexus' },
];

export default function Partners() {
  const { t } = useTranslation();

  return (
    <section className="partners section" id='partners'>
      <div className="container-tcar">
        <SectionTitle
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
          className="partners_swiper"
        >
          {logos.map((logo) => (
            <SwiperSlide key={logo.name}>
              <div className="partner_logo">
                <Image
                  src={logo.image}
                  alt={logo.name}
                  width={140}
                  height={70}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}