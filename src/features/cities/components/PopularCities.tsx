'use client';

import {useLocale, useTranslations} from 'next-intl';
import Image from 'next/image';
import {
  FiArrowRight,
  FiArrowLeft,
  FiMapPin
} from 'react-icons/fi';

import SectionTitle from '@/shared/ui/SectionTitle';
import type { City } from '../model';
import { useCarouselRail } from '@/shared/hooks/useCarouselRail';
import { getDirection } from '@/shared/config/languages';

import { Link } from '@/i18n/navigation';


interface Props {
  cities: City[];
}

export default function PopularCities({ cities }: Props) {
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


          {cities.map((city) => (

            <Link
              key={city.id}
              href={`/cities/${city.slug}`}
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