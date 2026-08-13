import BookingDetailsHeader from '@components/bookings/details/BookingDetailsHeader';
import BookingHero from '@components/bookings/details/BookingHero';
import BookingDatesInfo from '@components/bookings/details/BookingDatesInfo';
import BookingCountdown from '@components/bookings/details/BookingCountdown';
import BookingSidebar from '@components/bookings/details/BookingSidebar';

import type { BookingDetailsView } from '@app-types/car';

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

  return (
    <section className="section booking-details-page">
      <div className="container-tcar">
        <div className="booking-details-container">
          <BookingDetailsHeader
            reference={booking.reference}
            statusLabel={booking.statusLabel}
            status={booking.status}
          />

          <BookingHero
            carName={booking.carName}
            carBrand={booking.carBrand}
            carImage={booking.carImage}
            showroom={booking.showroom}
            pricePerDay={booking.pricePerDay}
            originalPrice={booking.originalPrice}
            status={booking.status}
            statusLabel={booking.statusLabel}
            pickupDateTime={booking.pickupDateTime}
            dropoffDateTime={booking.dropoffDateTime}
          />

          <div className="booking-grid">
            <div className="booking-main">
              <BookingDatesInfo
                pickupLocation={booking.pickupLocation}
                dropoffLocation={booking.dropoffLocation}
                pickupDateTime={booking.pickupDateTime}
                dropoffDateTime={booking.dropoffDateTime}
                warrantyNote={booking.warrantyNote}
              />

              {(booking.status === 'current' || booking.status === 'late') && (
                <BookingCountdown
                  pickupDateTime={booking.pickupDateTime}
                  targetDateTime={booking.dropoffDateTime}
                />
              )}
            </div>

            <BookingSidebar
              reference={booking.reference}
              pricePerDay={booking.pricePerDay}
              days={booking.days}
              subtotal={booking.subtotal}
              vatRate={booking.vatRate}
              vat={booking.vat}
              pointsUsed={booking.pointsUsed}
              total={booking.total}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
