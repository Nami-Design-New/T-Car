import { type Order } from "@/features/orders";
import BookingDetailsHeader from "./BookingDetailsHeader";
import BookingHero from "./BookingHero";
import BookingDatesInfo from "./BookingDatesInfo";
import BookingCountdown from "./BookingCountdown";
import BookingModificationPayment from "./BookingModificationPayment";
import BookingModificationNotice from "./BookingModificationNotice";
import BookingNotices from "./BookingNotices";
import BookingOrderTime from "./BookingOrderTime";
import BookingSidebar from "./BookingSidebar";

interface Props {
  booking: Order;
}

export default function BookingDetailsScreen({ booking }: Props) {
  return (
    <section className="bg-surface-on-background py-8 pb-16">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="mx-auto flex max-w-270 flex-col gap-6">
          <BookingDetailsHeader booking={booking} />

          <BookingHero booking={booking} />

          <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-[860px]:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-6">
              {/* Upcoming or running: payment-safety and direct-extension
                  notices. */}
              {(booking.status === "coming" ||
                booking.status === "current") && <BookingNotices />}
              {booking.modifyRequestPendingPayment &&
              booking.modifyRequestPaymentAmount !== null ? (
                <BookingModificationPayment
                  bookingId={booking.id}
                  amount={booking.modifyRequestPaymentAmount}
                />
              ) : booking.hasModifyRequest ? (
                <BookingModificationNotice />
              ) : null}
              <BookingDatesInfo booking={booking} />

              {/* Only a late booking: the card counts the time overdue since
                  the return time. */}
              {booking.status === "late" && (
                <BookingCountdown targetDateTime={booking.returnAt} />
              )}
            </div>

            <BookingSidebar booking={booking} />
          </div>
        </div>
      </div>
    </section>
  );
}
