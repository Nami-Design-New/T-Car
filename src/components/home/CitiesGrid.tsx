'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi';
import type { City } from '@app-types/car';

import c1 from '@assets/images/c1.jpg';
import c2 from '@assets/images/c2.jpg';
import c3 from '@assets/images/c3.jpg';
import c4 from '@assets/images/c4.jpg';
import c5 from '@assets/images/c5.jpg';
import c6 from '@assets/images/c6.jpg';

const ALL_CITIES: (Omit<City, 'image'> & { image: typeof c1 })[] = [
  { id: '1', name: 'الرياض', slug: 'riyadh', image: c1, carsAvailable: 128 },
  { id: '2', name: 'جدة', slug: 'jeddah', image: c2, carsAvailable: 96 },
  { id: '3', name: 'الدمام', slug: 'dammam', image: c3, carsAvailable: 54 },
  { id: '4', name: 'المدينة المنورة', slug: 'madinah', image: c4, carsAvailable: 41 },
  { id: '5', name: 'مكة المكرمة', slug: 'makkah', image: c5, carsAvailable: 73 },
  { id: '6', name: 'أبها', slug: 'abha', image: c6, carsAvailable: 22 },
];

export default function CitiesGrid() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!query.trim()) return ALL_CITIES;
    return ALL_CITIES.filter((city) => city.name.includes(query.trim()));
  }, [query]);

  return (
    <>
      <div className="cities-page-search">
        <FiSearch className="cities-page-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="ابحث باسم المدينة"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filteredCities.length === 0 ? (
        <p className="cities-page-empty">لا توجد مدن مطابقة لبحثك</p>
      ) : (
        <div className="cities-page-grid">
          {filteredCities.map((city) => (
            <Link key={city.id} href={`/cities/${city.slug}`} className="city-card">
              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
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
      )}
    </>
  );
}