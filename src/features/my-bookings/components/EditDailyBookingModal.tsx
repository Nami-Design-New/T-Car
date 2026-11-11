"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { BookingTimeSlots } from "@/features/booking";
import {
  checkAvailabilityAction,
  hasDeliveryType,
  type BookingEditRequest,
  type Order,
} from "@/features/orders";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { fromActionResult, type Result } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

import { NumberStepper } from "@/shared/ui/NumberStepper";
import { PriceRow } from "@/shared/ui/PriceRow";

const toApiDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: BookingEditRequest) => Promise<Result<void>>;
  initialDetails: BookingEditRequest;
  booking: Order;
  loading?: boolean;
}

/** UI for the existing edit-request flow; O10's API preview will replace its price data. */
export default function EditDailyBookingModal({
  open,
  onClose,
  onSubmit,
  initialDetails,
  booking,
  loading = false,
}: Props) {
  const t = useTranslations("myBookings.edit");
  const bookingT = useTranslations("booking.daily");
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const [days, setDays] = useState(initialDetails.days);
  const [time, setTime] = useState(initialDetails.time.slice(0, 2));
  const [error, setError] = useState<string>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>();
  const endDate = useMemo(() => {
    const value = new Date(initialDetails.startDate);
    value.setDate(value.getDate() + days);
    return value;
  }, [days, initialDetails.startDate]);
  const endDateLabel = format.dateTime(endDate, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setAvailabilityError(undefined);

    const deliveryType = hasDeliveryType(booking.bookingType)
      ? booking.deliveryType === "from_branch"
        ? "from_branch"
        : "to_location"
      : undefined;

    void checkAvailabilityAction({
      carId: booking.car.id,
      branchId: booking.branch.id,
      type: booking.bookingType,
      fromDay: booking.pickupAt.slice(0, 10),
      toDay: toApiDay(endDate),
      ...(deliveryType ? { deliveryType } : {}),
    }).then((actionResult) => {
      if (!active) return;

      setLoadingSlots(false);
      const result = fromActionResult(actionResult);
      if (result.ok) {
        setAvailableSlots(result.data.slots);
        setTime((currentTime) =>
          result.data.slots.includes(currentTime) ? currentTime : "",
        );
        if (result.data.slots.length === 0) {
          setAvailabilityError(
            result.data.message || bookingT("noAvailableTimes"),
          );
        }
        return;
      }

      setAvailabilityError(
        result.error.serverMessage ?? errorMessage(result.error),
      );
    });

    return () => {
      active = false;
    };
  }, [booking, bookingT, endDate, errorMessage, open]);

  const changeDays = (value: number) => {
    setDays(value);
    setTime("");
  };
  const close = () => {
    if (loading) return;
    setDays(initialDetails.days);
    setTime(initialDetails.time.slice(0, 2));
    setError(undefined);
    setAvailabilityError(undefined);
    onClose();
  };
  const submit = async () => {
    const result = await onSubmit({ ...initialDetails, endDate, days, time });
    if (!result.ok) setError(result.error.serverMessage ?? t("failed"));
  };
  return (
    <Dialog open={open} onClose={close} size="lg" label={t("dialogLabel")}>
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="space-y-5">
        <section className="bg-action-primary/10 flex flex-col items-center justify-center gap-8 rounded-lg p-4 text-center">
          <p className="text-text-primary text-sm font-semibold">{t("days")}</p>
          <NumberStepper
            value={days}
            onChange={changeDays}
            disabled={loading}
            decreaseLabel={t("decreaseDays")}
            increaseLabel={t("increaseDays")}
          />
          <p className="text-text-subtle text-xs">
            {t("daysHint", { days: endDateLabel })}
          </p>
        </section>
        <BookingTimeSlots
          label={t("pickupTime")}
          slots={availableSlots}
          value={time}
          onChange={setTime}
          loading={loadingSlots}
          loadingText={bookingT("loadingTimes")}
          emptyText={bookingT("noAvailableTimes")}
          error={
            availabilityError ? (
              <p className="text-status-error text-sm" role="alert">
                {availabilityError}
              </p>
            ) : undefined
          }
        />
        <section className="border-stroke-light rounded-lg border p-4">
          <h3 className="text-text-primary mb-3 text-sm font-bold">
            {t("priceDetails")}
          </h3>
          <div>
            <PriceRow
              label={t("carPrice")}
              amount={booking.price}
              hint={`${booking.count} × ${booking.carPrice}`}
            />
            {booking.additionalServicesCost > 0 && (
              <PriceRow
                label={t("services")}
                amount={booking.additionalServicesCost}
              />
            )}
            {booking.deliveryFee > 0 && (
              <PriceRow label={t("deliveryFee")} amount={booking.deliveryFee} />
            )}
            {booking.serviceFee > 0 && (
              <PriceRow label={t("serviceFee")} amount={booking.serviceFee} />
            )}
            {booking.completionFee > 0 && (
              <PriceRow
                label={t("completionFee")}
                amount={booking.completionFee}
              />
            )}
            {booking.discount > 0 && (
              <PriceRow label={t("discount")} amount={-booking.discount} />
            )}
            <PriceRow label={t("subtotal")} amount={booking.totalPrice} />
            <PriceRow label={t("vat")} amount={booking.taxValue} />
            <PriceRow label={t("total")} amount={booking.finalPrice} total />
          </div>
          {/* <p className="text-text-subtle mt-3 text-xs">{t("pricePending")}</p> */}
        </section>
        {error && (
          <p className="text-status-error text-sm" role="alert">
            {error}
          </p>
        )}
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => void submit()}
          loading={loading}
          disabled={loading || loadingSlots || !!availabilityError || !time}
        >
          {t("submit")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
