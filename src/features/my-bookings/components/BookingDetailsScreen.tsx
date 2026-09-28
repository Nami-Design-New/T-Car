import { isRentalRunning, type BookingDetailsView } from '../model';
import BookingDetailsHeader from './BookingDetailsHeader';
import BookingHero from './BookingHero';
import BookingDatesInfo from './BookingDatesInfo';
import BookingCountdown from './BookingCountdown';
import BookingSidebar from './BookingSidebar';

interface Props {
  booking: BookingDetailsView;
}

export default function BookingDetailsScreen({ booking }: Props) {
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

              {isRentalRunning(booking.status) && (
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
