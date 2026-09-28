import { BookingDetailsScreen, type BookingDetailsView } from '@/features/my-bookings';

import car1 from '@assets/images/car1.jpg';

interface Props {
  params: Promise<{ id: string }>;
}

async function getBookingDetails(id: string): Promise<BookingDetailsView> {
  return {
    id,
    reference: '2383',

    carName: 'E-Class',
    carBrand: 'مرسيدس',
    carImage: car1,

    showroom: 'معرض السلطان',

    status: 'current',
    statusLabel: 'حالي',

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
}

export default async function BookingDetailsPage({ params }: Props) {
  const { id } = await params;

  const booking = await getBookingDetails(id);

  return <BookingDetailsScreen booking={booking} />;
}
