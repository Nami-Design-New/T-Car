"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FiMapPin } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { MapLocationModal } from "@/shared/ui/MapLocationModal";
import { cn } from "@/shared/lib/cn";
import type { LocationData } from "@/shared/lib/location";
import type { BookingDetails } from "@/features/booking";
import { TIME_SLOTS } from "@/features/booking/validation";
import { ICONS } from "@/shared/config/assets";

const deliveryCarIcon = ICONS.deliveryCar;

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (details: BookingDetails) => void;
  modal?: boolean;
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

function getMonthlyRange(months: number): DateRange {
  const start = new Date();
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
}: Props) {
  const t = useTranslations("booking.daily");
  const tm = useTranslations("booking.monthly");
  const [rentalMonths, setRentalMonths] = useState(1);
  const [range, setRange] = useState<DateRange>(() => getMonthlyRange(1));
  const [time, setTime] = useState<(typeof TIME_SLOTS)[number]>("9:00 AM");
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

  const changeRentalMonths = (months: number) => {
    const nextMonths = Math.min(12, Math.max(1, months));
    setRentalMonths(nextMonths);
    setRange(getMonthlyRange(nextMonths));
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
      onClose={onClose}
      size="lg"
      modal={modal}
      label={tm("title")}
    >
      <Dialog.Header>
        <Dialog.Title>{tm("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="mt-6 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-surface-elevated p-6 animate-[popup_0.35s_ease]">
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

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              {t("pickupDropoffTime")}
            </label>
            <Swiper
              slidesPerView={4.5}
              spaceBetween={6}
              watchOverflow
              className="rounded-md border border-stroke-light bg-surface-card-primary p-1.5"
            >
              {TIME_SLOTS.map((slot) => (
                <SwiperSlide key={slot} className="!h-auto">
                  <button
                    type="button"
                    aria-label={slot}
                    className={cn(
                      "flex min-h-9 w-full items-center justify-center rounded-md border-0 px-2 py-2 text-xs text-text-primary",
                      time === slot &&
                        "!bg-action-primary font-bold !text-text-on-action",
                    )}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {(["pickup", "dropoff"] as const).map((field) => {
            const pickup = field === "pickup";
            const address = pickup ? pickupAddress : dropoffAddress;
            const location = pickup ? pickupLocation : dropoffLocation;
            return (
              <div key={field} className="mb-5 flex flex-col gap-2">
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
            >
              {t("continue")}
            </Button>
            <div className="flex flex-col items-start">
              <span className="text-xs text-text-subtle">{t("total")}</span>
              <h3 className="m-0 text-xl font-extrabold text-action-primary">
                {formatCurrency(total)}
              </h3>
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
