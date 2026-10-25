import { isRentalRunning, type BookingDetailsView } from "../model";
import BookingDetailsHeader from "./BookingDetailsHeader";
import BookingHero from "./BookingHero";
import BookingDatesInfo from "./BookingDatesInfo";
import BookingCountdown from "./BookingCountdown";
import BookingSidebar from "./BookingSidebar";

interface Props {
  booking: BookingDetailsView;
}

export default function BookingDetailsScreen({ booking }: Props) {
  return (
    <section className="bg-surface-on-background py-8 pb-16">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <div className="mx-auto flex max-w-270 flex-col gap-6">
          <BookingDetailsHeader booking={booking} />

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

          <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-[860px]:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-6">
              <BookingDatesInfo
                pickupLocation={booking.pickupLocation}
                dropoffLocation={booking.dropoffLocation}
                pickupDateTime={booking.pickupDateTime}
                dropoffDateTime={booking.dropoffDateTime}
                warrantyNote={booking.warrantyNote}
              />

              {isRentalRunning(booking.status) && (
                <BookingCountdown targetDateTime={booking.dropoffDateTime} />
              )}
            </div>

            <BookingSidebar
              bookingId={booking.id}
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
