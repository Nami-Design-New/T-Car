"use client";

import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

import { ICONS } from "@/shared/config/assets";
import type { BookingDetails, PaymentMethod } from "../model";
const RiyalIcon = ICONS.riyal;

import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { useCreateBooking } from "../hooks/useCreateBooking";

const BookingDailyModal = dynamic(() => import("./BookingDailyModal"), {
  ssr: false,
});
const BookingConfirmModal = dynamic(() => import("./BookingConfirmModal"), {
  ssr: false,
});
const PaymentMethodModal = dynamic(() => import("./PaymentMethodModal"), {
  ssr: false,
});

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
  pricePerDay: number;
  originalPrice?: number;
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
  pricePerDay,
  originalPrice,
}: Props) {
  const t = useTranslations("booking.card");
  const [flow, setFlow] = useState<Flow>({ step: "closed" });
  const { step } = flow;
  const setStep = (next: "closed" | "dates" | "confirm" | "payment") =>
    setFlow({ step: next });
  const { submitting, createBooking } = useCreateBooking(carId);
  const errorMessage = useErrorMessage();

  const [booking, setBooking] = useState<BookingDetails | null>(null);

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

  return (
    <aside className=" rounded-xl border border-stroke-light bg-surface-elevated p-6 shadow-[0_2px_8px_rgba(30,30,30,0.06)]">
      <div className=" mb-4.5">
        {originalPrice && (
          <span className=" mb-1 block ">
            <Price amount={originalPrice} strike={true} />
          </span>
        )}

        <div className=" flex items-end gap-2">
          <h2 className="m-0 flex items-center gap-1.5 text-3xl font-extrabold leading-none text-text-primary">
            <Price amount={pricePerDay} />
          </h2>
          <small className="text-4 text-text-subtle">{t("perDay")}</small>
        </div>
      </div>

      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={() => setStep("dates")}
      >
        {t("bookNow")}
      </Button>

      <p className="mt-2 text-center text-sm text-text-subtle">
        {t("paymentNote")}
      </p>

      {step === "dates" && (
        <BookingDailyModal
          open
          onClose={() => setStep("closed")}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
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
