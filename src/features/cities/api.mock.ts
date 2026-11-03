import { AppError } from '@/shared/lib/errors';
import type { CitiesApi } from './api';
import type { City } from './model';

const CITIES: Record<'ar' | 'en', City[]> = {
  en: [
    {
      id: '1',
      name: 'Riyadh',
      region: 'منطقة الرياض',
      image: '/mock/cities/city-1.jpg',
      carsAvailable: 51,
    },
    {
      id: '2',
      name: 'Jeddah',
      region: 'مكة المكرمة',
      image: '/images/placeholders/image-fallback.svg',
      carsAvailable: 1148,
    },
  ],
  ar: [
    {
      id: '1',
      name: 'الرياض',
      region: 'منطقة الرياض',
      image: '/mock/cities/city-1.jpg',
      carsAvailable: 51,
    },
    {
      id: '2',
      name: 'جدة',
      region: 'مكة المكرمة',
      image: '/images/placeholders/image-fallback.svg',
      carsAvailable: 1148,
    },
  ],
};

/*
 * Test double of the live `CitiesApi` (no production caller, no mock flag).
 * Stateless, so it is safe on the server.
 * Failure rule: an unsupported locale throws a server AppError.
 */
export const citiesMock: CitiesApi = {
  async listCities(locale) {
    if (locale !== 'ar' && locale !== 'en') throw new AppError('server');
    return [...CITIES[locale]];
  },
};
