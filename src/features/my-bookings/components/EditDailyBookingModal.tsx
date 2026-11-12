"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { BookingTimeSlots } from "@/features/booking";
import {
  checkAvailabilityAction,
  hasDeliveryType,
  type BookingEditRequest,
  type ModificationQuote,
  type ModificationRequest,
  type Order,
} from "@/features/orders";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { fromActionResult, type Result } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

import { NumberStepper } from "@/shared/ui/NumberStepper";
import { PriceRow } from "@/shared/ui/PriceRow";

const toApiDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const toApiTime = (value: string) =>
  /^\d{2}$/.test(value) ? `${value}:00` : value;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    request: ModificationRequest,
  ) => Promise<Result<ModificationQuote>>;
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
  const notify = useNotify();
  const [days, setDays] = useState(initialDetails.days);
  const [time, setTime] = useState(initialDetails.time.slice(0, 2));
  const [error, setError] = useState<string>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>();
  const [quote, setQuote] = useState<ModificationQuote>();
  const lastAvailabilityKey = useRef<string | undefined>(undefined);
  const isMonthly = booking.bookingType === "monthly";
  const endDate = useMemo(() => {
    const value = new Date(initialDetails.startDate);
    if (isMonthly) value.setMonth(value.getMonth() + days);
    else value.setDate(value.getDate() + days);
    return value;
  }, [days, initialDetails.startDate, isMonthly]);
  const endDateLabel = format.dateTime(endDate, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!open) {
      lastAvailabilityKey.current = undefined;
      return;
    }

    const availabilityKey = `${booking.id}:${days}`;
    if (lastAvailabilityKey.current === availabilityKey) return;
    lastAvailabilityKey.current = availabilityKey;

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
      ...(isMonthly
        ? { count: days }
        : { toDay: toApiDay(endDate) }),
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
      if (lastAvailabilityKey.current === availabilityKey)
        lastAvailabilityKey.current = undefined;
    };
  }, [booking.id, days, isMonthly, open]);

  const initialTime = toApiTime(initialDetails.time);
  const preview = (nextDays: number, nextTime: string) => {
    const daysChanged = nextDays !== initialDetails.days;
    const request: ModificationRequest = daysChanged
      ? {
          type: "days_count",
          count: nextDays,
          store: false,
          ...(nextTime && toApiTime(nextTime) !== initialTime
            ? { pickupTime: toApiTime(nextTime) }
            : {}),
        }
      : { type: "pickup_time", pickupTime: toApiTime(nextTime), store: false };
    void onSubmit(request).then((result) => {
      if (result.ok) setQuote(result.data);
      else {
        const message = result.error.serverMessage ?? t("failed");
        setError(message);
        if (result.error.kind === "validation") notify.error(message);
      }
    });
  };
  const changeDays = (value: number) => {
    setDays(value);
    preview(value, time);
  };
  const changeTime = (value: string) => {
    setTime(value);
    preview(days, value);
  };
  const close = () => {
    if (loading) return;
    setDays(initialDetails.days);
    setTime(initialDetails.time.slice(0, 2));
    setError(undefined);
    setAvailabilityError(undefined);
    setQuote(undefined);
    onClose();
  };
  const submit = async () => {
    const daysChanged = days !== initialDetails.days;
    const request: ModificationRequest = daysChanged
      ? {
          type: "days_count",
          count: days,
          store: true,
            ...(time && toApiTime(time) !== initialTime
            ? { pickupTime: toApiTime(time) }
            : {}),
        }
      : { type: "pickup_time", pickupTime: toApiTime(time), store: true };
    const result = await onSubmit(request);
    if (!result.ok) {
      const message = result.error.serverMessage ?? t("failed");
      setError(message);
      if (result.error.kind === "validation") notify.error(message);
    }
  };
  return (
    <Dialog open={open} onClose={close} size="lg" label={t("dialogLabel")}>
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="space-y-5">
        <section className="bg-action-primary/10 flex flex-col items-center justify-center gap-8 rounded-lg p-4 text-center">
          <p className="text-text-primary text-sm font-semibold">
            {t(isMonthly ? "months" : "days")}
          </p>
          <NumberStepper
            value={days}
            onChange={changeDays}
            disabled={loading}
            decreaseLabel={t(isMonthly ? "decreaseMonths" : "decreaseDays")}
            increaseLabel={t(isMonthly ? "increaseMonths" : "increaseDays")}
          />
          <p className="text-text-subtle text-xs">
            {t("daysHint", { days: endDateLabel })}
          </p>
        </section>
        <BookingTimeSlots
          label={t("pickupTime")}
          slots={availableSlots}
          value={time}
          onChange={changeTime}
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
              amount={quote?.price ?? booking.price}
              hint={`${quote?.count ?? booking.count} × ${quote?.carPrice ?? booking.carPrice}`}
            />
            {(quote?.additionalServicesCost ?? booking.additionalServicesCost) >
              0 && (
              <PriceRow
                label={t("services")}
                amount={
                  quote?.additionalServicesCost ??
                  booking.additionalServicesCost
                }
              />
            )}
            {(quote?.deliveryFee ?? booking.deliveryFee) > 0 && (
              <PriceRow
                label={t("deliveryFee")}
                amount={quote?.deliveryFee ?? booking.deliveryFee}
              />
            )}
            {(quote?.serviceFee ?? booking.serviceFee) > 0 && (
              <PriceRow
                label={t("serviceFee")}
                amount={quote?.serviceFee ?? booking.serviceFee}
              />
            )}
            {(quote?.completionFee ?? booking.completionFee) > 0 && (
              <PriceRow
                label={t("completionFee")}
                amount={quote?.completionFee ?? booking.completionFee}
              />
            )}
            {(quote?.discount ?? booking.discount) > 0 && (
              <PriceRow
                label={t("discount")}
                amount={-(quote?.discount ?? booking.discount)}
              />
            )}
            <PriceRow
              label={t("subtotal")}
              amount={quote?.totalPrice ?? booking.totalPrice}
            />
            <PriceRow
              label={t("vat")}
              amount={quote?.taxValue ?? booking.taxValue}
            />
            <PriceRow
              label={t("total")}
              amount={quote?.newFinalPrice ?? booking.finalPrice}
              total
            />
          </div>
          {/* <p className="text-text-subtle mt-3 text-xs">{t("pricePending")}</p> */}
        </section>
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
