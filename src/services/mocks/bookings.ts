import type { BookingDetailsView, UserBooking } from '@/features/my-bookings/model';
import { AppError } from '@/shared/lib/errors';
import type { BookingsApi } from '../bookings.api';
import car1 from '@assets/images/car1.jpg';

export const MOCK_BOOKINGS: UserBooking[] = [
  {
    id: '1',
    carName: 'ماليبو',
    carBrand: 'شيفروليه',
    carImage: car1,
    year: 2022,
    rating: 4.4,
    showroom: 'معرض القدس',
    status: 'current',
    statusLabel: 'حالي',
    dateLabel: '30 يونيو 2026، 11:46 م',
  },
  {
    id: '2',
    carName: 'ألتيما',
    carBrand: 'نيسان',
    carImage: car1,
    year: 2022,
    rating: 4.5,
    showroom: 'معرض الخليج',
    status: 'upcoming',
    statusLabel: 'قادم',
    dateLabel: '18 يوليو 2026، 01:15 م',
  },
  {
    id: '3',
    carName: 'أكورد',
    carBrand: 'هوندا',
    carImage: car1,
    year: 2023,
    rating: 4.6,
    showroom: 'معرض العروبة',
    status: 'late',
    statusLabel: 'متأخر عن التسليم',
    dateLabel: '30 يونيو 2026، 11:46 م',
  },
  {
    id: '4',
    carName: 'مازدا 6',
    carBrand: 'مازدا',
    carImage: car1,
    year: 2024,
    rating: 4.8,
    showroom: 'معرض النخبة',
    status: 'completed',
    statusLabel: 'مكتمل',
    dateLabel: '8 أبريل 2026، 12:00 م',
  },
  {
    id: '5',
    carName: 'إمبالا',
    carBrand: 'شيفروليه',
    carImage: car1,
    year: 2021,
    rating: 4.2,
    showroom: 'معرض القدس',
    status: 'cancelled',
    statusLabel: 'ملغي',
    dateLabel: '22 مارس 2026، 07:45 م',
  },
];

/** Dates, prices, and places shared by every mock booking; the car and status come from the list. */
const MOCK_DETAILS_BASE: Omit<
  BookingDetailsView,
  'id' | 'carName' | 'carBrand' | 'carImage' | 'showroom' | 'status' | 'statusLabel'
> = {
  reference: '2383',
  pricePerDay: 500,
  originalPrice: 600,
  pickupDateTime: '2026-08-13T16:30:00',
  dropoffDateTime: '2026-08-24T16:30:00',
  pickupLocation: 'الرياض، شارع الملك عبدالله الدولي المحدودة',
  dropoffLocation: 'الرياض، أبي بكر الرازي',
  warrantyNote: 'الضِّمن السيارة تكون جاهزة قبل الموعد',
  pointsUsed: 100,
  days: 5,
  subtotal: 2500,
  vatRate: 5,
  vat: 600,
  total: 2400,
};

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Read-only, so it is safe to run on the server.
export const bookingsMock: BookingsApi = {
  async getBookings() {
    await delay();
    return [...MOCK_BOOKINGS];
  },

  async getBookingDetails(id) {
    await delay();
    const booking = MOCK_BOOKINGS.find((item) => item.id === id);
    if (!booking) throw new AppError('not_found', 'bookings.notFound');

    const { carName, carBrand, carImage, showroom, status, statusLabel } = booking;
    return { ...MOCK_DETAILS_BASE, id, carName, carBrand, carImage, showroom, status, statusLabel };
  },
};
