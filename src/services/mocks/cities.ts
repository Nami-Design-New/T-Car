import type { City } from '@/features/cities/model';
import { AppError } from '@/shared/lib/errors';
import type { CitiesApi } from '../cities.api';
import c1 from '@assets/images/c1.jpg';
import c2 from '@assets/images/c2.jpg';
import c3 from '@assets/images/c3.jpg';
import c4 from '@assets/images/c4.jpg';
import c5 from '@assets/images/c5.jpg';
import c6 from '@assets/images/c6.jpg';

export const MOCK_CITIES: City[] = [
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

// Read-only, so it is safe to run on the server.
export const citiesMock: CitiesApi = {
  async listCities() {
    return [...MOCK_CITIES];
  },

  async getCityDetails(slug) {
    const city = MOCK_CITIES.find((item) => item.slug === slug);
    if (!city) throw new AppError('not_found', 'cities.notFound');

    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
      heroImage: city.image,
      carsCount: city.carsAvailable,
    };
  },
};
