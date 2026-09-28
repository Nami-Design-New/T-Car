import type { CarListing, Office, OfficeCarGroup } from '@app-types/car';
import b1 from '@assets/images/b1.webp';
import b2 from '@assets/images/b2.webp';
import b3 from '@assets/images/b3.webp';
import b4 from '@assets/images/b4.webp';
import b5 from '@assets/images/b5.webp';
import b6 from '@assets/images/b6.webp';
import b7 from '@assets/images/b7.webp';
import b8 from '@assets/images/b8.webp';

export const MOCK_OFFICES: Office[] = [
  { id: 'el-nokhba', slug: 'el-nokhba', name: 'النخبة', showroom: 'معرض النخبة', logo: b1 },
  { id: 'al-mutahida', slug: 'al-mutahida', name: 'المتحدة', showroom: 'معرض المتحدة', logo: b2 },
  { id: 'al-khaleej', slug: 'al-khaleej', name: 'الخليج', showroom: 'معرض الخليج', logo: b3 },
  { id: 'al-rouwa', slug: 'al-rouwa', name: 'الرواد', showroom: 'معرض الرواد', logo: b4 },
  { id: 'al-safwa', slug: 'al-safwa', name: 'الصفوة', showroom: 'معرض الصفوة', logo: b5 },
  { id: 'al-sharq', slug: 'al-sharq', name: 'الشرق', showroom: 'معرض الشرق', logo: b6 },
  { id: 'al-sakhra', slug: 'al-sakhra', name: 'الصخراء', showroom: 'معرض الصخراء', logo: b7 },
  { id: 'al-mutawassit', slug: 'al-mutawassit', name: 'المتوسط', showroom: 'معرض المتوسط', logo: b8 },
];

/**
 * Buckets cars into office rows using `Office.showroom` as the join key, so the
 * offices list stays the single source of truth for both the row title and the
 * cars shown under it. Offices with no cars are dropped.
 */
export function groupCarsByOffice(cars: CarListing[]): OfficeCarGroup[] {
  return MOCK_OFFICES.map((office) => ({
    office,
    cars: cars.filter((car) => car.showroom === office.showroom),
  })).filter((group) => group.cars.length > 0);
}
