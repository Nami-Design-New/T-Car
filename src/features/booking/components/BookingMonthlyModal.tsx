"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type BookingContext,
} from "@/features/orders";
import { fromActionResult } from "@/shared/lib/result";
import type { Result } from "@/shared/lib/result";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { ICONS } from "@/shared/config/assets";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingBranchSummary from "./BookingBranchSummary";
import MonthCountPicker from "./MonthCountPicker";
import { allowedAreaOf, mapStartLocation } from "./bookingMap";

const deliveryCarIcon = ICONS.deliveryCar;

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (
    details: BookingDetails,
  ) => void | Result<void> | Promise<void | Result<void>>;
  loading?: boolean;
  modal?: boolean;
  availability?: {
    carId: string;
    branchId: string;
    deliveryType: BookingDeliveryTypeRequest;
    branch?: NonNullable<BookingContext["branch"]>;
    showroom?: string;
    showroomLogo?: string;
    branchAddress?: string;
    /** Car details `allowed_distance` (km): drawn around the branch on the map. */
    allowedDistanceKm?: number;
  };
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

type MapField = "pickup" | "dropoff";

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
  loading = false,
  modal = true,
  availability,
}: Props) {
  const t = useTranslations("booking.daily");
  const tm = useTranslations("booking.monthly");
  const tc = useTranslations("booking.card");
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
  // The chosen point, else the saved browser location (read once per opening).
  const mapStart = useMemo(
    () =>
      mapField === null
        ? null
        : mapStartLocation(
            mapField === "dropoff" ? dropoffLocation : pickupLocation,
          ),
    [mapField, dropoffLocation, pickupLocation],
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const pickupDateInputRef = useRef<HTMLInputElement>(null);
  const notify = useNotify();
  const errorMessage = useErrorMessage();

  const changeRentalMonths = (months: number) => {
    setRentalMonths(months);
    setRange(getMonthlyRange(months, range.start ?? undefined));
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
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

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
        const message =
          result.error.serverMessage ?? errorMessage(result.error);
        if (result.error.serverMessage)
          notify.error(result.error.serverMessage);
        setAvailabilityError(message);
      }
    });
    return () => {
      active = false;
    };
  }, [availability, errorMessage, open, notify, range.start, rentalMonths, t]);

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
  // The branch delivery range from car details (allowed_distance).
  const distanceHint = availability?.allowedDistanceKm
    ? tm.rich("distanceHint", {
        distance: availability.allowedDistanceKm.toLocaleString(),
        strong: (chunks) => <strong>{chunks}</strong>,
      })
    : null;

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

  const handleConfirmClick = async () => {
    if (!range.start || !range.end) return;
    const result = await onConfirm({
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
    if (result && !result.ok) {
      notify.error(result.error.serverMessage ?? errorMessage(result.error));
    }
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
        className="border-stroke-light bg-surface-card-primary grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border px-3 py-2 text-start"
        onClick={() => setMapField(field)}
        aria-label={pickup ? t("changePickup") : t("changeDropoff")}
      >
        <span
          className="bg-surface-elevated grid size-9 place-items-center rounded-sm"
          aria-hidden="true"
        >
          <Image src={deliveryCarIcon} alt="" width={24} height={24} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <strong className="text-text-primary truncate text-xs">
            {getAddressTitle(address, fallback)}
          </strong>
          <small className="text-text-primary truncate text-[10px]">
            {address}
          </small>
        </span>
        <span className="text-text-subtle text-[9px] whitespace-nowrap">
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
        className="border-stroke-light bg-surface-elevated focus:border-action-primary focus:ring-action-primary/15 w-full rounded-md border px-4 py-3 text-sm transition outline-none focus:ring-4"
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
      <Dialog.Body>
        <div className="bg-surface-elevated relative min-h-0 flex-1 animate-[popup_0.35s_ease] overflow-y-auto">
          <MonthCountPicker
            value={rentalMonths}
            onChange={changeRentalMonths}
            startDate={range.start!}
            endDate={range.end!}
          />

          <div className="mb-5 flex flex-col gap-2">
            <label
              htmlFor="monthly-pickup-date"
              className="text-text-primary text-sm font-semibold"
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
              className={
                "text-start! rtl:text-end! [&::-webkit-calendar-picker-indicator]:opacity-0"
              }
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

          {availability?.deliveryType === "from_branch" &&
          availability.branch ? (
            <BookingBranchSummary
              branch={availability.branch}
              showroom={availability.showroom ?? ""}
              showroomLogo={availability.showroomLogo}
              pickupLabel={t("pickupAddress")}
              returnLabel={t("dropoffAddress")}
              returnTitle={t("returnToNearestBranchTitle")}
              returnMessage={t("returnToNearestBranchMessage")}
              distanceLabel={t("kilometerShort")}
            />
          ) : availability?.deliveryType === "from_branch" ? (
            <div className="border-stroke-light bg-surface-card-primary mb-5 rounded-md border p-3">
              <p className="text-text-primary mb-1 text-sm font-semibold">
                {t("pickupAddress")}
              </p>
              <p className="text-text-subtle m-0 text-sm">
                {availability.branchAddress ?? t("pickupLocation")}
              </p>
            </div>
          ) : (
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
                        className="text-text-primary text-sm font-semibold"
                      >
                        {pickup ? t("pickupAddress") : t("dropoffAddress")}
                      </label>
                      <button
                        type="button"
                        className="text-action-primary inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold"
                        onClick={() => setMapField(field)}
                      >
                        <FiMapPin aria-hidden="true" />
                        {t("chooseFromMap")}
                      </button>
                    </div>
                    {addressCard(field, address, location)}
                    {distanceHint && (
                      <p className="text-text-subtle m-0 text-xs">
                        {distanceHint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-2">
            <label className="text-text-primary text-sm font-semibold">
              {t("additionalDetails")}
            </label>
            <textarea
              rows={4}
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="border-stroke-light bg-surface-elevated focus:border-action-primary focus:ring-action-primary/15 w-full resize-y rounded-md border px-4 py-3.5 text-[15px] transition focus:ring-4 focus:outline-none"
            />
          </div>

          <div className="border-stroke-light flex items-center gap-3.5 border-t pt-4">
            <Button
              type="button"
              className="order-2 flex-1"
              onClick={handleConfirmClick}
              disabled={loading || loadingSlots || availableSlots.length === 0}
            >
              {t("continue")}
            </Button>

            {/* The car price per month, as on the booking card; the draft (E2) gives the total. */}
            <div className="booking_total flex shrink-0 items-end gap-1.5">
              <Price
                amount={pricePerDay}
                amountClassName="text-2xl font-extrabold text-action-primary"
              />
              <small className="text-text-subtle text-base">
                {tc("perMonth")}
              </small>
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
          initialLocation={mapStart}
          allowedArea={allowedAreaOf(
            availability?.branch,
            availability?.allowedDistanceKm,
          )}
        />
      )}
    </Dialog>
  );
}
