"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FiChevronRight, FiChevronLeft, FiMapPin } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { Result } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput, FormTextarea } from "@/shared/ui/Form";
import { cn } from "@/shared/lib/cn";
import type { BookingDetails } from "../model";
import {
  bookingDetailsSchema,
  TIME_SLOTS,
  type BookingDetailsFormValues,
} from "../validation";
import { ICONS } from "@/shared/config/assets";
const deliveryCarIcon = ICONS.deliveryCar;
import { MapLocationModal } from "@/shared/ui/MapLocationModal";
import type { LocationData } from "@/shared/lib/location";
import { Price } from "@/shared/ui/Price";

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

export default function BookingDailyModal({
  open,
  onClose,
  pricePerDay,
  onConfirm,
  initialDetails = null,
  mode = "create",
  loading = false,
}: Props) {
  const t = useTranslations("booking.daily");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [mapField, setMapField] = useState<MapField | null>(null);
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<BookingDetailsFormValues, unknown, BookingDetails>({
    resolver: zodResolver(bookingDetailsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      startDate: null,
      endDate: null,
      time: "9:00 AM",
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
        time: TIME_SLOTS.includes(
          initialDetails.time as (typeof TIME_SLOTS)[number],
        )
          ? (initialDetails.time as (typeof TIME_SLOTS)[number])
          : "9:00 AM",
        pricePerDay,
      });
      return;
    }

    reset({
      startDate: null,
      endDate: null,
      time: "9:00 AM",
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
  }, [open, initialDetails, pricePerDay, reset]);

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
  const subtotal = pricePerDay * totalDays;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

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
      onClose={onClose}
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
                <FiChevronLeft className="mirror-in-rtl" aria-hidden="true" />
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
                <FiChevronRight className="mirror-in-rtl" aria-hidden="true" />
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

                return (
                  <span
                    key={i}
                    className={cn(
                      "cell flex h-10 items-center justify-center",
                      inRange && "bg-action-primary/15",
                      isStart && "rounded-s-md bg-action-primary/15",
                      isEnd && "rounded-e-md bg-action-primary/15",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={Boolean(isStart || isEnd)}
                      className={cn(
                        "size-full rounded-md border-0 bg-transparent text-sm font-semibold text-text-primary transition hover:bg-surface-card-primary disabled:cursor-not-allowed disabled:text-text-placeholder",
                        (isStart || isEnd) &&
                          "selected !bg-action-primary font-bold !text-text-on-action hover:!bg-action-primary",
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

          <div className="mb-4.5">
            <label className="mb-2 block text-start text-sm font-bold text-text-primary">
              {t("pickupDropoffTime")}
            </label>
            <Swiper
              slidesPerView={4.5}
              spaceBetween={6}
              watchOverflow
              className="time-swiper p-1.5"
            >
              {TIME_SLOTS.map((slot) => {
                const [hour, period] = slot.split(" ");

                return (
                  <SwiperSlide key={slot} className="!h-auto">
                    <button
                      type="button"
                      aria-label={slot}
                      aria-pressed={time === slot}
                      className={cn(
                        "flex min-h-9 cursor-pointer w-full items-center justify-center gap-1 rounded-md border-0 px-2 py-2 text-xs text-text-primary transition",
                        time === slot &&
                          "!bg-action-primary font-bold !text-text-on-action shadow-[0_3px_8px_rgba(31,127,250,0.2)]",
                      )}
                      onClick={() =>
                        setValue("time", slot as (typeof TIME_SLOTS)[number], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <span dir="ltr">{hour}</span>
                      <small className="text-[10px] opacity-80">{period}</small>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            {errors.time && (
              <p className="form_error" role="alert">
                {fieldError(errors.time.message)}
              </p>
            )}
          </div>

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

          <div className="booking_field">
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
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={!range.start || !range.end}
              loading={loading}
            >
              {mode === "edit" ? t("submitEdit") : t("continue")}
            </Button>

            <div className="booking_total shrink-0 text-center">
              <span className="block text-md text-text-subtle">
                {t("total")}
              </span>
              <Price
                amount={total}
                amountClassName="text-2xl font-extrabold text-text-primary"
              />
            </div>
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
