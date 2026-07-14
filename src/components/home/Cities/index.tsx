'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiArrowLeft, FiMapPin } from 'react-icons/fi';
import SectionTitle from '@components/common/SectionTitle';
import type { City } from '@app-types/car';

import c1 from '@assets/images/c1.jpg';
import c2 from '@assets/images/c2.jpg';
import c3 from '@assets/images/c3.jpg';
import c4 from '@assets/images/c4.jpg';
import c5 from '@assets/images/c5.jpg';
import c6 from '@assets/images/c6.jpg';

const AUTOPLAY_INTERVAL = 3500;

const MOCK_CITIES: (Omit<City, 'image'> & { image: typeof c1 })[] = [
  { id: '1', name: 'الرياض', slug: 'riyadh', image: c1, carsAvailable: 128 },
  { id: '2', name: 'جدة', slug: 'jeddah', image: c2, carsAvailable: 96 },
  { id: '3', name: 'الدمام', slug: 'dammam', image: c3, carsAvailable: 54 },
  { id: '4', name: 'المدينة المنورة', slug: 'madinah', image: c4, carsAvailable: 41 },
  { id: '5', name: 'مكة المكرمة', slug: 'makkah', image: c5, carsAvailable: 73 },
  { id: '6', name: 'أبها', slug: 'abha', image: c6, carsAvailable: 22 },
];

export default function PopularCities() {
  const { t, i18n } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRTL = i18n.dir() === 'rtl';

  const scroll = useCallback(
    (direction: 'prev' | 'next') => {
      const el = trackRef.current;
      if (!el) return;

      const cardWidth = el.firstElementChild?.clientWidth ?? 300;
      const amount = cardWidth + 24; // + gap
      const sign = direction === 'next' ? (isRTL ? -1 : 1) : (isRTL ? 1 : -1);

      const maxScroll = el.scrollWidth - el.clientWidth;
      const atEnd = isRTL
        ? Math.abs(el.scrollLeft) >= maxScroll - 5
        : el.scrollLeft >= maxScroll - 5;
      const atStart = Math.abs(el.scrollLeft) <= 5;

      if (direction === 'next' && atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (direction === 'prev' && atStart) {
        el.scrollTo({ left: isRTL ? -maxScroll : maxScroll, behavior: 'smooth' });
        return;
      }

      el.scrollBy({ left: sign * amount, behavior: 'smooth' });
    },
    [isRTL]
  );

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    intervalRef.current = setInterval(() => scroll('next'), AUTOPLAY_INTERVAL);
  }, [scroll]);

  const stopAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay]);

  const handleManualScroll = (direction: 'prev' | 'next') => {
    stopAutoplay();
    scroll(direction);
    startAutoplay(); 
  };

  return (
    <section className="section popular-cities"  id="cities">
      <div className="container-tcar">
        <div className="popular-cities-header">
          <SectionTitle
            title={t('popularCities.title')}
            subtitle={t('popularCities.subtitle')}
          />

          <div className="slider-controls">
            <button type="button" aria-label="السابق" onClick={() => handleManualScroll('prev')}>
              {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
            </button>
            <button type="button" aria-label="التالي" onClick={() => handleManualScroll('next')}>
              {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
            </button>
          </div>
        </div>

        <div
          className="cities-track"
          ref={trackRef}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
        >
          {MOCK_CITIES.map((city) => (
            <Link key={city.id} href={`/cities/${city.slug}`} className="city-card">
              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width: 768px) 80vw, 320px"
                className="city-card-image"
              />

              <div className="city-card-scrim" />

              <span className="city-card-badge">
                <FiMapPin />
                {city.carsAvailable} {t('popularCities.carsAvailable')}
              </span>

              <div className="city-card-content">
                <h3>{city.name}</h3>

                <span className="city-card-cta">
                  {t('popularCities.explore')}
                  <FiArrowRight className="cta-icon" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}