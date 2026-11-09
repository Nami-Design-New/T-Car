"use client";

import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LazyAuthModal } from "@/features/auth";

import { ICONS } from "@/shared/config/assets";
import type {
  BookingContext,
  BookingDetails,
  PaymentMethod,
} from "@/features/orders";
const RiyalIcon = ICONS.riyal;

import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { useCreateBooking } from "../hooks/useCreateBooking";

const BookingDailyModal = dynamic(() => import("./BookingDailyModal"), {
  ssr: false,
});
const BookingMonthlyModal = dynamic(() => import("./BookingMonthlyModal"), {
  ssr: false,
});
const BookingConfirmModal = dynamic(() => import("./BookingConfirmModal"), {
  ssr: false,
});
const PaymentMethodModal = dynamic(() => import("./PaymentMethodModal"), {
  ssr: false,
});
const BookingLoginRequiredModal = dynamic(
  () => import("./BookingLoginRequiredModal"),
  { ssr: false },
);

/** One sheet at a time. A failed booking keeps the payment sheet open with the error. */
type Flow =
  | { step: "closed" }
  | { step: "dates" }
  | { step: "confirm" }
  | { step: "payment"; error?: AppError }
  | { step: "success" };

interface Props {
  carId: string;
  carName: string;
  carBrand: string;
  carYear: number;
  showroomLogo?: string;
  carImage: string;
  showroom: string;
  rating: number;
  /** API `lower_price`: the sale price, or 0 when there is no discount. */
  lowerPrice: number;
  /** API `max_price`: the regular price, struck through when discounted. */
  maxPrice: number;
  bookingContext: BookingContext;
  signedIn?: boolean;
}

export default function CarBookingCard({
  carId,
  carName,
  carBrand,
  carYear,
  showroomLogo,
  carImage,
  showroom,
  rating,
  lowerPrice,
  maxPrice,
  bookingContext,
  signedIn = true,
}: Props) {
  const t = useTranslations("booking.card");
  // Same rule as the cars list: charge lower_price when set, else max_price.
  const pricePerDay = lowerPrice > 0 ? lowerPrice : maxPrice;
  const strikePrice =
    lowerPrice > 0 && maxPrice > lowerPrice ? maxPrice : undefined;
  const [flow, setFlow] = useState<Flow>({ step: "closed" });
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { step } = flow;
  const setStep = (next: "closed" | "dates" | "confirm" | "payment") =>
    setFlow({ step: next });
  const { submitting, createBooking } = useCreateBooking(carId);
  const errorMessage = useErrorMessage();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const canBook = Boolean(bookingContext.location && bookingContext.branch);

  const handleDatesConfirmed = (details: BookingDetails) => {
    setBooking(details);
    setStep("confirm");
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!booking || submitting) return;

    const result = await createBooking(booking, method, true);
    setFlow(
      result.ok
        ? { step: "success" }
        : { step: "payment", error: result.error },
    );
  };

  const handleBookingSuccess = () =>
    window.location.assign("/account/bookings");

  const handleBookNow = () => {
    if (!signedIn) {
      setLoginRequiredOpen(true);
      return;
    }
    setStep("dates");
  };

  return (
    <aside className="border-stroke-light bg-surface-elevated rounded-xl border p-6 shadow-[0_2px_8px_rgba(30,30,30,0.06)] max-lg:flex max-lg:items-end max-lg:gap-4 max-lg:p-4">
      <div className="mb-4.5 flex flex-col items-center gap-2 max-lg:mb-0 max-lg:shrink-0 md:flex-row">
        <div className="flex items-end gap-2">
          <h2 className="m-0 flex items-center gap-1.5 leading-none">
            <Price amountClassName="text-action-primary" amount={pricePerDay} />
          </h2>
          <small className="text-text-subtle text-base">{t("perDay")}</small>
        </div>
        <div className="flex items-center gap-2">
          <p className="m-0">{t("insteadOf")}</p>
          {strikePrice !== undefined && (
            <span className="block">
              <Price amount={strikePrice} strike={true} />
            </span>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full max-lg:flex-1"
        size="lg"
        onClick={handleBookNow}
        disabled={!canBook}
      >
        {t("bookNow")}
      </Button>

      {!canBook && (
        <p className="mt-2 text-center text-sm text-status-error">
          {t("chooseLocation")}
        </p>
      )}

      <BookingLoginRequiredModal
        open={loginRequiredOpen}
        onClose={() => setLoginRequiredOpen(false)}
        onLogin={() => {
          setLoginRequiredOpen(false);
          setAuthOpen(true);
        }}
      />

      {authOpen && (
        <LazyAuthModal show onHide={() => setAuthOpen(false)} />
      )}

      {step === "dates" && bookingContext.bookingType === "monthly" && (
        <BookingMonthlyModal
          open
          onClose={() => setStep("closed")}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
          availability={{
            carId,
            branchId: bookingContext.branch!.id,
            deliveryType: bookingContext.deliveryType,
          }}
        />
      )}

      {step === "dates" && bookingContext.bookingType !== "monthly" && (
        <BookingDailyModal
          open
          onClose={() => setStep("closed")}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
          availability={{
            carId,
            branchId: bookingContext.branch!.id,
            deliveryType: bookingContext.deliveryType,
          }}
        />
      )}

      {booking && step === "confirm" && (
        <BookingConfirmModal
          open
          onClose={() => setStep("closed")}
          onBack={() => setStep("dates")}
          onContinue={() => setStep("payment")}
          carName={carName}
          carBrand={carBrand}
          carYear={carYear}
          showroomLogo={showroomLogo}
          carImage={carImage}
          showroom={showroom}
          rating={rating}
          booking={booking}
        />
      )}

      {step === "payment" && (
        <PaymentMethodModal
          open
          onClose={() => {
            if (!submitting) setStep("closed");
          }}
          onConfirm={handlePay}
          loading={submitting}
          error={
            flow.step === "payment" && flow.error
              ? errorMessage(flow.error)
              : undefined
          }
        />
      )}

      <ResultDialog
        open={step === "success"}
        status="success"
        description={t("successDescription")}
        autoCloseMs={1500}
        onClose={handleBookingSuccess}
      />
    </aside>
  );
}
