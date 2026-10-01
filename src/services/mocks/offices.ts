import type { Office } from '@/features/cars/model';
const b1 = '/mock/offices/office-1.webp';
const b2 = '/mock/offices/office-2.webp';
const b3 = '/mock/offices/office-3.webp';
const b4 = '/mock/offices/office-4.webp';
const b5 = '/mock/offices/office-5.webp';
const b6 = '/mock/offices/office-6.webp';
const b7 = '/mock/offices/office-7.webp';
const b8 = '/mock/offices/office-8.webp';

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
