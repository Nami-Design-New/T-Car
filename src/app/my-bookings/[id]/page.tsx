import BookingDetailsHeader from '@components/bookings/details/BookingDetailsHeader';
import BookingHero from '@components/bookings/details/BookingHero';
import BookingDatesInfo from '@components/bookings/details/BookingDatesInfo';
import BookingCountdown from '@components/bookings/details/BookingCountdown';
import BookingSidebar from '@components/bookings/details/BookingSidebar';
import type { BookingDetailsView } from '@app-types/car';

import car1 from '@assets/images/car1.jpg';

interface Props {
  params: { id: string };
}

async function getBookingDetails(id: string): Promise<BookingDetailsView> {
  return {
    id,
    reference: '2383',
    carName: 'E-Class',
    carBrand: 'مرسيدس',
    carImage: car1,
    showroom: 'معرض السلطان',
    status: 'active',
    statusLabel: 'حالي',
    pricePerDay: 500,
    originalPrice: 600,
    pickupDateTime: '2026-05-07T16:30:00',
    dropoffDateTime: '2026-05-11T16:30:00',
    warrantyNote: 'الضِّمن السيارة تكون جاهزة قبل الموعد',
    days: 5,
    subtotal: 2500,
    vatRate: 5,
    vat: 600,
    total: 2400,
  };
}

export default async function BookingDetailsPage({ params }: Props) {
  const booking = await getBookingDetails(params.id);

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
          />

          <div className="booking-grid">
            <div className="booking-main">
              <BookingDatesInfo
                pickupDateTime={booking.pickupDateTime}
                dropoffDateTime={booking.dropoffDateTime}
                warrantyNote={booking.warrantyNote}
              />

              {booking.status === 'active' && (
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
              total={booking.total}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


