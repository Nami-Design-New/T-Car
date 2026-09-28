'use client';

import {useLocale, useTranslations} from 'next-intl';
import Image from 'next/image';
import {
  FiArrowRight,
  FiArrowLeft,
  FiMapPin
} from 'react-icons/fi';

import SectionTitle from '@/shared/ui/SectionTitle';
import type {City} from '@app-types/car';
import { useCarouselRail } from '@/shared/hooks/useCarouselRail';
import { getDirection } from '@/shared/config/languages';

import c1 from '@assets/images/c1.jpg';
import c2 from '@assets/images/c2.jpg';
import c3 from '@assets/images/c3.jpg';
import c4 from '@assets/images/c4.jpg';
import c5 from '@assets/images/c5.jpg';
import c6 from '@assets/images/c6.jpg';
import { Link } from '@/i18n/navigation';

const MOCK_CITIES: (Omit<City, 'image'> & {image: typeof c1})[] = [
  {
    id: '1',
    name: 'الرياض',
    slug: 'riyadh',
    image: c1,
    carsAvailable: 128
  },
  {
    id: '2',
    name: 'جدة',
    slug: 'jeddah',
    image: c2,
    carsAvailable: 96
  },
  {
    id: '3',
    name: 'الدمام',
    slug: 'dammam',
    image: c3,
    carsAvailable: 54
  },
  {
    id: '4',
    name: 'المدينة المنورة',
    slug: 'madinah',
    image: c4,
    carsAvailable: 41
  },
  {
    id: '5',
    name: 'مكة المكرمة',
    slug: 'makkah',
    image: c5,
    carsAvailable: 73
  },
  {
    id: '6',
    name: 'أبها',
    slug: 'abha',
    image: c6,
    carsAvailable: 22
  }
];

export default function PopularCities() {
  const t = useTranslations();
  const locale = useLocale();

  const isRTL = getDirection(locale) === 'rtl';

  const {
    trackRef,
    scrollPrev,
    scrollNext,
    pause: stopAutoplay,
    resume: startAutoplay
  } = useCarouselRail({isRTL});

  return (
    <section
      className="section popular-cities"
      id="cities"
    >

      <div className="container-tcar">


        <div className="popular-cities-header">


          <SectionTitle
            title={t('popularCities.title')}
            subtitle={t('popularCities.subtitle')}
          />


          <div className="slider-controls">


            <button
              type="button"
              aria-label="previous"
              onClick={scrollPrev}
            >
              <FiArrowLeft className="mirror-in-rtl" />

            </button>



            <button
              type="button"
              aria-label="next"
              onClick={scrollNext}
            >

              <FiArrowRight className="mirror-in-rtl" />

            </button>


          </div>


        </div>



        <div
          className="cities-track"
          ref={trackRef}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          dir={isRTL ? 'rtl' : 'ltr'}
        >


          {MOCK_CITIES.map((city) => (

            <Link
              key={city.id}
              href={`/${locale}/cities/${city.slug}`}
              className="city-card"
            >


              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width:768px) 80vw,320px"
                className="city-card-image"
              />


              <div className="city-card-scrim" />



              <span className="city-card-badge">

                <FiMapPin />

                {city.carsAvailable}{' '}
                {t(
                  'popularCities.carsAvailable'
                )}

              </span>




              <div className="city-card-content">


                <h3>
                  {city.name}
                </h3>


                <span className="city-card-cta">

                  {t(
                    'popularCities.explore'
                  )}

                  <FiArrowRight className="cta-icon mirror-in-rtl" />

                </span>


              </div>


            </Link>

          ))}


        </div>


      </div>

    </section>
  );
}