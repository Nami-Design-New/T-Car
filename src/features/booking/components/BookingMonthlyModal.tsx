"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiCalendar, FiMapPin } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form";
import { Dialog } from "@/shared/ui/Dialog";
import { Price } from "@/shared/ui/Price";
import { MapLocationModal } from "@/shared/ui/MapLocationModal";
import { cn } from "@/shared/lib/cn";
import type { LocationData } from "@/shared/lib/location";
import {
  checkAvailabilityAction,
  type BookingDeliveryTypeRequest,
  type BookingDetails,
} from "@/features/orders";
import { fromActionResult } from "@/shared/lib/result";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { ICONS } from "@/shared/config/assets";
import BookingTimeSlots from "./BookingTimeSlots";

const deliveryCarIcon = ICONS.deliveryCar;

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (details: BookingDetails) => void;
  modal?: boolean;
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

function getMonthlyRange(months: number, startDate = new Date()): DateRange {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return { start, end };
}

function getAddressTitle(address: string, fallback: string) {
  return address.split(",")[0]?.trim() || fallback;
}

export default function BookingMonthlyModal({
  open,
  onClose,
  pricePerDay,
  onConfirm,
  modal = true,
  availability,
}: Props) {
  const t = useTranslations("booking.daily");
  const tm = useTranslations("booking.monthly");
  const [rentalMonths, setRentalMonths] = useState(1);
  const [range, setRange] = useState<DateRange>(() => getMonthlyRange(1));
  const [time, setTime] = useState("9:00 AM");
  const [notes, setNotes] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(
    null,
  );
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(
    null,
  );
  const [mapField, setMapField] = useState<MapField | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const pickupDateInputRef = useRef<HTMLInputElement>(null);
  const notify = useNotify();
  const errorMessage = useErrorMessage();

  const changeRentalMonths = (months: number) => {
    const nextMonths = Math.min(12, Math.max(1, months));
    setRentalMonths(nextMonths);
    setRange(getMonthlyRange(nextMonths, range.start ?? undefined));
  };

  const changePickupDate = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    start.setHours(0, 0, 0, 0);
    setRange(getMonthlyRange(rentalMonths, start));
  };

  const openPickupDatePicker = () => {
    const input = pickupDateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
    }
  };

  const handleClose = () => {
    setRentalMonths(1);
    setRange(getMonthlyRange(1));
    setTime("9:00 AM");
    setNotes("");
    setPickupAddress("");
    setDropoffAddress("");
    setPickupLocation(null);
    setDropoffLocation(null);
    setMapField(null);
    setAvailableSlots([]);
    setLoadingSlots(false);
    setAvailabilityError(null);
    onClose();
  };

  const toApiDay = (date: Date) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

  useEffect(() => {
    if (!open || !availability || !range.start) return;
    let active = true;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setAvailabilityError(null);
    void checkAvailabilityAction({
      ...availability,
      type: "monthly",
      fromDay: toApiDay(range.start),
      count: rentalMonths,
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
      } else {
        const message = result.error.serverMessage ?? errorMessage(result.error);
        if (result.error.serverMessage) notify.error(result.error.serverMessage);
        setAvailabilityError(message);
      }
    });
    return () => {
      active = false;
    };
  }, [
    availability,
    errorMessage,
    open,
    notify,
    range.start,
    rentalMonths,
    t,
  ]);

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
  const monthProgress = (rentalMonths / 12) * 100;
  const formatShort = (date: Date) =>
    `${date.getDate()} ${t(`months.${MONTHS[date.getMonth()]}`)} ${date.getFullYear()}`;
  const distanceHint = tm.rich("distanceHint", {
    strong: (chunks) => <strong>{chunks}</strong>,
  });

  const handleLocationConfirm = (location: LocationData) => {
    const address =
      location.address ||
      `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
    const selectedLocation = { ...location, address };
    if (mapField === "pickup") {
      setPickupAddress(address);
      setPickupLocation(selectedLocation);
    } else if (mapField === "dropoff") {
      setDropoffAddress(address);
      setDropoffLocation(selectedLocation);
    }
    setMapField(null);
  };

  const handleConfirmClick = () => {
    if (!range.start || !range.end) return;
    onConfirm({
      startDate: range.start,
      endDate: range.end,
      time,
      notes,
      days: totalDays,
      pricePerDay,
      subtotal,
      vat,
      total,
      pickupAddress,
      dropoffAddress,
      pickupLocation,
      dropoffLocation,
        bookingType: "monthly",
        months: rentalMonths,
    });
  };

  const addressCard = (
    field: MapField,
    address: string,
    location: LocationData | null,
  ) => {
    const pickup = field === "pickup";
    const fallback = pickup ? t("pickupLocation") : t("dropoffLocation");
    return location ? (
      <button
        type="button"
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border border-stroke-light bg-surface-card-primary px-3 py-2 text-start"
        onClick={() => setMapField(field)}
        aria-label={pickup ? t("changePickup") : t("changeDropoff")}
      >
        <span
          className="grid size-9 place-items-center rounded-sm bg-surface-elevated"
          aria-hidden="true"
        >
          <Image src={deliveryCarIcon} alt="" width={24} height={24} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <strong className="truncate text-xs text-text-primary">
            {getAddressTitle(address, fallback)}
          </strong>
          <small className="truncate text-[10px] text-text-primary">
            {address}
          </small>
        </span>
        <span className="whitespace-nowrap text-[9px] text-text-subtle">
          {t("selected")}
        </span>
      </button>
    ) : (
      <input
        id={`${field}-address`}
        type="text"
        placeholder={t("enterAddress")}
        value={address}
        onChange={(event) => {
          if (pickup) {
            setPickupAddress(event.target.value);
            setPickupLocation(null);
          } else {
            setDropoffAddress(event.target.value);
            setDropoffLocation(null);
          }
        }}
        className="w-full rounded-md border border-stroke-light bg-surface-elevated px-4 py-3 text-sm outline-none transition focus:border-action-primary focus:ring-4 focus:ring-action-primary/15"
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="lg"
      modal={modal}
      label={tm("title")}
    >
      <Dialog.Header>
        <Dialog.Title>{tm("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="mt-6 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-surface-elevated  animate-[popup_0.35s_ease]">
          <div className="mb-5 rounded-[14px] bg-[#eaf3ff] px-[22px] py-5 text-center">
            <div className="mb-2 text-sm text-[#101820]">
              {tm("monthsCount")}
            </div>
            <div className="mx-auto mb-[18px] flex max-w-[225px] items-center justify-between">
              <button
                type="button"
                className="grid size-7 place-items-center rounded-md border-0 bg-white text-[22px] leading-none text-[#101820] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tm("increase")}
                onClick={() => changeRentalMonths(rentalMonths + 1)}
                disabled={rentalMonths === 12}
              >
                +
              </button>
              <strong className="text-[32px] leading-none text-[#101820]">
                {rentalMonths}
              </strong>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-md border-0 bg-white text-[22px] leading-none text-[#101820] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tm("decrease")}
                onClick={() => changeRentalMonths(rentalMonths - 1)}
                disabled={rentalMonths === 1}
              >
                −
              </button>
            </div>
            <div className="relative mb-3.5 h-[60px] overflow-hidden rounded-[13px] bg-[#a4a4a4] text-white">
              <span
                className="absolute inset-y-0 start-0 rounded-[13px] bg-[#287ff0] transition-[width] duration-200"
                style={{ width: `${monthProgress}%` }}
              />
              <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm">
                {tm("months", { count: rentalMonths })}
              </span>
              <span
                className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[15px]"
                style={{ insetInlineStart: `calc(${monthProgress}% - 28px)` }}
              >
                <span>▶</span>
                <span className="size-6 rounded-full border-2 border-white bg-[#287ff0] shadow-sm" />
                <span>◀</span>
              </span>
              <input
                type="range"
                className="absolute inset-0 z-2 m-0 h-full w-full cursor-pointer opacity-0"
                min="1"
                max="12"
                step="1"
                value={rentalMonths}
                aria-label={tm("sliderLabel")}
                onChange={(event) =>
                  changeRentalMonths(Number(event.target.value))
                }
              />
            </div>
            <div className="text-[13px] text-[#101820]">
              {formatShort(range.start!)} <strong>{t("to")}</strong>{" "}
              {formatShort(range.end!)}
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label
              htmlFor="monthly-pickup-date"
              className="text-sm font-semibold text-text-primary"
            >
              {tm("pickupDay")}
            </label>
            <FormInput
              id="monthly-pickup-date"
              ref={pickupDateInputRef}
              type="date"
              dir={"rtl"}
              min={toApiDay(new Date())}
              value={range.start ? toApiDay(range.start) : ""}
              onChange={(event) => changePickupDate(event.target.value)}
              aria-label={tm("pickupDay")}
              placeholder={tm("datePlaceholder")}
              icon={<FiCalendar aria-hidden="true" />}
              iconAction={openPickupDatePicker}
              iconActionLabel={tm("pickupDay")}
              className={"[&::-webkit-calendar-picker-indicator]:opacity-0 rtl:text-end! text-start!"}
            />
          </div>

          <BookingTimeSlots
            label={t("pickupDropoffTime")}
            slots={availableSlots}
            emptyText={t("noAvailableTimes")}
            value={time}
            onChange={setTime}
            loading={loadingSlots}
            loadingText={t("loadingTimes")}
            error={
              availabilityError ? (
                <p className="form_error" role="alert">
                  {availabilityError}
                </p>
              ) : undefined
            }
          />

          <div className="mb-5 grid gap-4 md:grid-cols-2">
            {(["pickup", "dropoff"] as const).map((field) => {
            const pickup = field === "pickup";
            const address = pickup ? pickupAddress : dropoffAddress;
            const location = pickup ? pickupLocation : dropoffLocation;
            return (
              <div key={field} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`${field}-address`}
                    className="text-sm font-semibold text-text-primary"
                  >
                    {pickup ? t("pickupAddress") : t("dropoffAddress")}
                  </label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-action-primary"
                    onClick={() => setMapField(field)}
                  >
                    <FiMapPin aria-hidden="true" />
                    {t("chooseFromMap")}
                  </button>
                </div>
                {addressCard(field, address, location)}
                <p className="m-0 text-xs text-text-subtle">{distanceHint}</p>
              </div>
            );
            })}
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-primary">
              {t("additionalDetails")}
            </label>
            <textarea
              rows={4}
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-y rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15"
            />
          </div>

          <div className="flex items-center gap-3.5 border-t border-stroke-light pt-4">
            <Button
              type="button"
              className="order-2 flex-1"
              onClick={handleConfirmClick}
              disabled={loadingSlots || availableSlots.length === 0}
            >
              {t("continue")}
            </Button>


            <div className="booking_total shrink-0 text-center">
              <span className="block text-md text-text-subtle">
                {t("total")}
              </span>
              <Price
                amount={total}
                amountClassName="text-2xl  font-extrabold text-action-primary"
              />
            </div>

          </div>
        </div>
      </Dialog.Body>

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
    </Dialog>
  );
}
