"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiChevronRight, FiChevronLeft, FiMapPin } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { fromActionResult, type Result } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput, FormTextarea } from "@/shared/ui/Form";
import { cn } from "@/shared/lib/cn";
import {
  checkAvailabilityAction,
  type BookingDeliveryTypeRequest,
  type BookingDetails,
} from "@/features/orders";
import {
  bookingDetailsSchema,
  type BookingDetailsFormValues,
} from "../validation";
import { ICONS } from "@/shared/config/assets";
const deliveryCarIcon = ICONS.deliveryCar;
import { MapLocationModal } from "@/shared/ui/MapLocationModal";
import type { LocationData } from "@/shared/lib/location";
import { Price } from "@/shared/ui/Price";
import BookingTimeSlots from "./BookingTimeSlots";

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (
    details: BookingDetails,
  ) => void | Result<void> | Promise<void | Result<void>>;
  initialDetails?: BookingDetails | null;
  mode?: "create" | "edit";
  loading?: boolean;
  availability?: {
    carId: string;
    branchId: string;
    deliveryType: BookingDeliveryTypeRequest;
  };
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

type MapField = "pickup" | "dropoff";

// Sunday-first, matching Date#getDay() (0 = Sunday) used by startOffset below.
// Column order is then handled by the inherited `dir`, not by reversing this
// array -- reversing it silently mislabels every column.
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const VAT_RATE = 0.15;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function getAddressTitle(address: string, fallback: string) {
  return address.split(",")[0]?.trim() || fallback;
}

function toApiDay(day: Date): string {
  return [
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, "0"),
    String(day.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function BookingDailyModal({
  open,
  onClose,
  pricePerDay,
  onConfirm,
  initialDetails = null,
  mode = "create",
  loading = false,
  availability,
}: Props) {
  const t = useTranslations("booking.daily");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [mapField, setMapField] = useState<MapField | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<BookingDetailsFormValues, unknown, BookingDetails>({
    resolver: zodResolver(bookingDetailsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      startDate: null,
      endDate: null,
      time: "",
      days: 1,
      pricePerDay,
      subtotal: 0,
      vat: 0,
      total: 0,
      notes: "",
      pickupAddress: "",
      dropoffAddress: "",
      pickupLocation: null,
      dropoffLocation: null,
    },
  });
  const time = watch("time");
  const notes = watch("notes");
  const pickupAddress = watch("pickupAddress") ?? "";
  const dropoffAddress = watch("dropoffAddress") ?? "";
  const pickupLocation = watch("pickupLocation") ?? null;
  const dropoffLocation = watch("dropoffLocation") ?? null;
  const pickupAddressField = register("pickupAddress");
  const dropoffAddressField = register("dropoffAddress");
  const notesField = register("notes");

  const handleClose = () => {
    reset({
      startDate: null,
      endDate: null,
      time: "",
      days: 1,
      pricePerDay,
      subtotal: 0,
      vat: 0,
      total: 0,
      notes: "",
      pickupAddress: "",
      dropoffAddress: "",
      pickupLocation: null,
      dropoffLocation: null,
    });
    setCursor(new Date());
    setRange({ start: null, end: null });
    setMapField(null);
    setAvailableSlots([]);
    setLoadingSlots(false);
    setAvailabilityError(null);
    onClose();
  };

  // Prefill when opened in edit mode or when initialDetails provided.
  useEffect(() => {
    if (!open) return;

    if (initialDetails) {
      const start = new Date(initialDetails.startDate);
      const end = new Date(initialDetails.endDate);
      setCursor(start);
      setRange({ start, end });
      reset({
        ...initialDetails,
        startDate: start,
        endDate: end,
        time: initialDetails.time,
        pricePerDay,
      });
      return;
    }

    reset({
      startDate: null,
      endDate: null,
      time: "",
      days: 1,
      pricePerDay,
      subtotal: 0,
      vat: 0,
      total: 0,
      notes: "",
      pickupAddress: "",
      dropoffAddress: "",
      pickupLocation: null,
      dropoffLocation: null,
    });
    setRange({ start: null, end: null });
    setAvailableSlots([]);
    setAvailabilityError(null);
  }, [open, initialDetails, pricePerDay, reset]);

  useEffect(() => {
    if (!open || mode === "edit" || !availability || !range.start || !range.end)
      return;

    let active = true;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setAvailabilityError(null);
    setValue("time", "", { shouldValidate: false });
    clearErrors();

    void checkAvailabilityAction({
      ...availability,
      type: "daily",
      fromDay: toApiDay(range.start),
      toDay: toApiDay(range.end),
    }).then((actionResult) => {
      if (!active) return;
      const result = fromActionResult(actionResult);
      setLoadingSlots(false);
      if (result.ok) {
        setAvailableSlots(result.data.slots);
        if (result.data.slots.length === 0) {
          const message = result.data.message || t("noAvailableTimes");
          notify.error(message);
          setAvailabilityError(message);
        }
        return;
      }

      const message = result.error.serverMessage ?? errorMessage(result.error);
      if (result.error.serverMessage) notify.error(result.error.serverMessage);
      setAvailabilityError(message);
    });

    return () => {
      active = false;
    };
  }, [
    availability,
    clearErrors,
    errorMessage,
    mode,
    notify,
    open,
    range.end,
    range.start,
    setError,
    setAvailabilityError,
    setValue,
    t,
  ]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePick = (day: Date) => {
    if (!range.start || range.end) {
      setRange({ start: day, end: null });
      setValue("startDate", day, { shouldValidate: true });
      setValue("endDate", null, { shouldValidate: true });
      setAvailableSlots([]);
      setValue("time", "", { shouldValidate: false });
      return;
    }

    const nextRange =
      day < range.start
        ? { start: day, end: range.start }
        : { start: range.start, end: day };
    setRange(nextRange);
    setValue("startDate", nextRange.start, { shouldValidate: true });
    setValue("endDate", nextRange.end, { shouldValidate: true });
    setValue(
      "days",
      Math.max(
        1,
        Math.round(
          (nextRange.end.getTime() - nextRange.start.getTime()) / 86400000,
        ),
      ),
      { shouldValidate: true },
    );
  };

  const totalDays =
    range.start && range.end
      ? Math.max(
          1,
          Math.round((range.end.getTime() - range.start.getTime()) / 86400000),
        )
      : 1;
  const calculatedSubtotal = pricePerDay * totalDays;
  const calculatedVat = Math.round(calculatedSubtotal * VAT_RATE);
  const subtotal =
    mode === "edit" ? (initialDetails?.subtotal ?? 0) : calculatedSubtotal;
  const vat = mode === "edit" ? (initialDetails?.vat ?? 0) : calculatedVat;
  const total =
    mode === "edit" ? (initialDetails?.total ?? 0) : subtotal + vat;

  const handleLocationConfirm = (location: LocationData) => {
    const address =
      location.address ||
      `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
    const selectedLocation = { ...location, address };

    if (mapField === "pickup") {
      setValue("pickupAddress", address, { shouldValidate: true });
      setValue("pickupLocation", selectedLocation, { shouldValidate: true });
    } else if (mapField === "dropoff") {
      setValue("dropoffAddress", address, { shouldValidate: true });
      setValue("dropoffLocation", selectedLocation, { shouldValidate: true });
    }

    setMapField(null);
  };

  const submit = handleSubmit(async (details) => {
    const result = await onConfirm({
      ...details,
      days: totalDays,
      pricePerDay,
      subtotal,
      vat,
      total,
    });

    if (!result || result.ok) return;

    for (const [field, message] of Object.entries(
      result.error.fieldErrors ?? {},
    )) {
      if (field in details) {
        setError(field as keyof BookingDetailsFormValues, {
          type: "server",
          message,
        });
      }
    }
    if (
      !result.error.fieldErrors ||
      Object.keys(result.error.fieldErrors).length === 0
    ) {
      setError("root.server", {
        type: "server",
        message: errorMessage(result.error),
      });
    }
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="lg"
      label={mode === "edit" ? t("editBooking") : t("newBooking")}
    >
      <Dialog.Header>
        <Dialog.Title>
          {mode === "edit" ? t("editBooking") : t("newBooking")}
        </Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="min-h-0 overflow-y-auto mt-6 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <form
          className=" relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-xl bg-surface-elevated p-6 animate-[popup_0.35s_ease]"
          onSubmit={submit}
          noValidate
        >
          <div className=" mb-5.5">
            <div className="calendar_header mb-4 flex items-center justify-between">
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border-0 bg-black/4 text-text-primary transition hover:bg-action-primary/10 hover:text-action-primary"
                aria-label={t("previousMonth")}
                onClick={() => setCursor(new Date(year, month - 1, 1))}
              >
                <FiChevronLeft className="rtl:scale-x-[-1]" aria-hidden="true" />
              </button>

              <span className="text-base font-bold text-text-primary">
                {t(`months.${MONTHS[month]}`)} {year}
              </span>

              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border-0 bg-black/4 text-text-primary transition hover:bg-action-primary/10 hover:text-action-primary"
                aria-label={t("nextMonth")}
                onClick={() => setCursor(new Date(year, month + 1, 1))}
              >
                <FiChevronRight className="rtl:scale-x-[-1]" aria-hidden="true" />
              </button>
            </div>

            <div className=" mb-2 grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="text-center text-[0.72rem] font-semibold text-text-subtle"
                >
                  {t(`weekdays.${day}`)}
                </span>
              ))}
            </div>

            <div className=" grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day)
                  return (
                    <span
                      key={i}
                      className="cell empty flex h-10 items-center justify-center"
                    />
                  );

                const disabled = day < today;
                const isStart = range.start && sameDay(day, range.start);
                const isEnd = range.end && sameDay(day, range.end);
                const inRange =
                  range.start &&
                  range.end &&
                  day > range.start &&
                  day < range.end;
                const hasRange = Boolean(range.start && range.end);
                const isSingleDay = Boolean(isStart && isEnd);

                return (
                  <span
                    key={i}
                    className={cn(
                      "cell flex h-10 items-center justify-center overflow-hidden",
                      inRange && "bg-action-primary/15",
                      isStart &&
                        (isSingleDay || !hasRange
                          ? "rounded-md bg-action-primary"
                          : "rounded-s-md bg-action-primary"),
                      isEnd && !isSingleDay && "rounded-e-md bg-action-primary",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={Boolean(isStart || isEnd)}
                      className={cn(
                        "size-full rounded-none border-0 bg-transparent text-sm font-semibold text-text-primary transition hover:bg-surface-card-primary disabled:cursor-not-allowed disabled:text-text-placeholder",
                        (isStart || isEnd) &&
                          "selected font-bold text-text-on-action! hover:bg-transparent!",
                      )}
                      onClick={() => handlePick(day)}
                    >
                      {day.getDate()}
                    </button>
                  </span>
                );
              })}
            </div>

            {range.start && (
              <div className=" mt-4 rounded-sm bg-surface-card-primary p-2.5 text-center text-[0.82rem] font-semibold text-action-primary">
                {range.end
                  ? `${range.start.toLocaleDateString()} ${t("to")} ${range.end.toLocaleDateString()}`
                  : `${range.start.toLocaleDateString()} — ${t("chooseEndDate")}`}
              </div>
            )}
            {(errors.startDate || errors.endDate) && (
              <p className=" text-sm text-status-error" role="alert">
                {fieldError(
                  errors.startDate?.message ?? errors.endDate?.message,
                )}
              </p>
            )}
          </div>

          <BookingTimeSlots
            label={t("pickupDropoffTime")}
            slots={
              mode === "edit" && initialDetails
                ? [initialDetails.time]
                : availableSlots
            }
            emptyText={
              mode === "edit" || (range.start && range.end)
                ? t("noAvailableTimes")
                : t("selectDatesFirst")
            }
            value={time}
            onChange={(slot) =>
              setValue("time", slot, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            loading={loadingSlots}
            loadingText={t("loadingTimes")}
            error={
              availabilityError ? (
                <p className="form_error" role="alert">
                  {availabilityError}
                </p>
              ) : errors.time ? (
                <p className="form_error" role="alert">
                  {fieldError(errors.time.message)}
                </p>
              ) : undefined
            }
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="mb-4.5 min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="font-bold text-text-primary"
                  htmlFor="pickup-address"
                >
                  {t("pickupAddress")}
                </label>
                <button
                  className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs text-action-primary underline underline-offset-2"
                  type="button"
                  onClick={() => setMapField("pickup")}
                >
                  <FiMapPin className="text-sm" />
                  {t("chooseFromMap")}
                </button>
              </div>
              {pickupLocation ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md border border-stroke-light bg-surface-card-primary p-3 text-start"
                  onClick={() => setMapField("pickup")}
                  aria-label={t("changePickup")}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-elevated">
                    <Image
                      src={deliveryCarIcon}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="truncate text-sm text-text-primary">
                      {getAddressTitle(pickupAddress, t("pickupLocation"))}
                    </strong>
                    <small className="truncate text-xs text-text-subtle">
                      {pickupAddress}
                    </small>
                  </span>
                  <span className="text-xs font-semibold text-action-primary">
                    {t("selected")}
                  </span>
                </button>
              ) : (
                <FormInput
                  {...pickupAddressField}
                  id="pickup-address"
                  type="text"
                  placeholder={t("enterAddress")}
                  error={
                    errors.pickupAddress
                      ? fieldError(errors.pickupAddress.message)
                      : undefined
                  }
                  value={pickupAddress}
                  onChange={(event) => {
                    setValue("pickupAddress", event.target.value, {
                      shouldValidate: true,
                    });
                    setValue("pickupLocation", null, { shouldValidate: true });
                  }}
                />
              )}
              <p className="mt-2 text-xs text-text-subtle">
                {t("distanceHint")}
              </p>
            </div>

            <div className="  mb-4.5 min-w-0">
              <div className=" mb-2 flex items-center justify-between">
                <label
                  className="font-bold text-text-primary"
                  htmlFor="dropoff-address"
                >
                  {t("dropoffAddress")}
                </label>
                <button
                  className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs text-action-primary underline underline-offset-2"
                  type="button"
                  onClick={() => setMapField("dropoff")}
                >
                  <FiMapPin className="text-sm" />
                  {t("chooseFromMap")}
                </button>
              </div>
              {dropoffLocation ? (
                <button
                  type="button"
                  className=" flex w-full items-center gap-3 rounded-md border border-stroke-light bg-surface-card-primary p-3 text-start"
                  onClick={() => setMapField("dropoff")}
                  aria-label={t("changeDropoff")}
                >
                  <span className=" grid size-9 shrink-0 place-items-center rounded-sm bg-surface-elevated">
                    <Image
                      src={deliveryCarIcon}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </span>
                  <span className=" flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="truncate text-sm text-text-primary">
                      {getAddressTitle(dropoffAddress, t("dropoffLocation"))}
                    </strong>
                    <small className="truncate text-xs text-text-subtle">
                      {dropoffAddress}
                    </small>
                  </span>
                  <span className="text-xs font-semibold text-action-primary">
                    {t("selected")}
                  </span>
                </button>
              ) : (
                <FormInput
                  {...dropoffAddressField}
                  id="dropoff-address"
                  type="text"
                  placeholder={t("enterAddress")}
                  error={
                    errors.dropoffAddress
                      ? fieldError(errors.dropoffAddress.message)
                      : undefined
                  }
                  value={dropoffAddress}
                  onChange={(event) => {
                    setValue("dropoffAddress", event.target.value, {
                      shouldValidate: true,
                    });
                    setValue("dropoffLocation", null, { shouldValidate: true });
                  }}
                />
              )}
              <p className="mt-2 text-xs text-text-subtle">
                {t("distanceHint")}
              </p>
            </div>
          </div>

          <div className="">
            <FormTextarea
              label={t("additionalDetails")}
              {...notesField}
              rows={4}
              placeholder={t("notesPlaceholder")}
              error={
                errors.notes ? fieldError(errors.notes.message) : undefined
              }
              value={notes}
              onChange={(event) =>
                setValue("notes", event.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
          </div>

          {errors.root?.server?.message && (
            <p className=" text-sm text-status-error" role="alert">
              {errors.root.server.message}
            </p>
          )}

          <div className="sticky bottom-[-24px] z-1 mb-[-24px] flex items-center gap-3.5 border-t border-stroke-light bg-surface-elevated pb-6 pt-4.5">
           {mode !== "edit" ? (
              <div className="booking_total shrink-0 text-center">
                <span className="block text-md text-text-subtle">
                  {t("total")}
                </span>
                <Price
                  amount={total}
                  amountClassName="text-2xl font-extrabold text-text-primary"
                />
              </div>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={!range.start || !range.end}
              loading={loading}
            >
              {mode === "edit" ? t("submitEdit") : t("continue")}
            </Button>


          </div>
        </form>
        {mapField !== null && (
          <MapLocationModal
            open
            onClose={() => setMapField(null)}
            onConfirm={handleLocationConfirm}
            title={
              mapField === "dropoff" ? t("selectDropoff") : t("selectPickup")
            }
            initialLocation={
              mapField === "dropoff" ? dropoffLocation : pickupLocation
            }
          />
        )}
      </Dialog.Body>
    </Dialog>
  );
}
