import type { RentalSearchOptions } from '@/features/rental-search/model';
import type { RentalSearchApi } from '../rentalSearch.api';
import flag1 from '@/assets/images/flages/flag1.png';
import flag2 from '@/assets/images/flages/flag2.png';
import flag3 from '@/assets/images/flages/flag3.png';
import flag4 from '@/assets/images/flages/flag4.png';
import flag5 from '@/assets/images/flages/flag5.png';

const MOCK_OPTIONS: RentalSearchOptions = {
  branches: [
    {
      id: 1,
      city: 'الرياض',
      branch: 'فرع العليا',
      address: 'طريق الملك فهد',
    },
    {
      id: 2,
      city: 'جدة',
      branch: 'فرع الروضة',
      address: 'شارع الأمير سلطان',
    },
    {
      id: 3,
      city: 'الدمام',
      branch: 'فرع الفيصلية',
      address: 'شارع الخليج',
    },
    {
      id: 4,
      city: 'المدينة',
      branch: 'فرع العزيزية',
      address: 'طريق الملك عبدالله',
    },
  ],
  airports: [
    {
      id: 1,
      city: 'الرياض',
      airport: 'مطار الملك خالد الدولي',
      code: 'RUH',
    },
    {
      id: 2,
      city: 'جدة',
      airport: 'مطار الملك عبدالعزيز الدولي',
      code: 'JED',
    },
    {
      id: 3,
      city: 'الدمام',
      airport: 'مطار الملك فهد الدولي',
      code: 'DMM',
    },
    {
      id: 4,
      city: 'المدينة',
      airport: 'مطار الأمير محمد بن عبدالعزيز',
      code: 'MED',
    },
    {
      id: 5,
      city: 'أبها',
      airport: 'مطار أبها الدولي',
      code: 'AHB',
    },
  ],
  stations: [
    {
      id: 1,
      city: 'الرياض',
      station: 'محطة قطار الرياض',
    },
    {
      id: 2,
      city: 'جدة',
      station: 'محطة قطار جدة',
    },
    {
      id: 3,
      city: 'المدينة',
      station: 'محطة قطار المدينة',
    },
    {
      id: 4,
      city: 'مكة',
      station: 'محطة قطار مكة',
    },
    {
      id: 5,
      city: 'الدمام',
      station: 'محطة قطار الدمام',
    },
  ],
  countries: [
    { id: 1, name: 'مصر', flag: flag1 },
    { id: 2, name: 'لبنان', flag: flag2 },
    { id: 3, name: 'المملكة العربية السعودية', flag: flag3 },
    { id: 4, name: 'الامارات', flag: flag4 },
    { id: 5, name: ' البحرين', flag: flag5 },
  ],
};

// Read-only, so it is safe to run on the server.
export const rentalSearchMock: RentalSearchApi = {
  async getOptions() {
    return MOCK_OPTIONS;
  },
};
