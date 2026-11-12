"use client";

import { FiCalendar, FiInfo, FiMapPin } from "react-icons/fi";
import { useLocale, useTranslations } from "next-intl";
import type { Order } from "@/features/orders";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import BookingOrderTime from "./BookingOrderTime";

const timeline = ICONS.timeline;
interface Props {
  booking: Order;
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BookingDatesInfo({ booking }: Props) {
  const t = useTranslations("myBookings.dates");
  const locale = useLocale();
  const branchAddress = `${booking.branch.title} — ${booking.branch.address}`;
  const pickupAddress =
    booking.deliveryType === "from_branch"
      ? branchAddress
      : (booking.pickupLocation.address ?? t("notProvided"));
  const dropoffAddress =
    booking.deliveryType === "from_branch"
      ? branchAddress
      : (booking.deliveryLocation.address ?? t("notProvided"));

  return (
    <div className="bg-surface-elevated flex flex-col gap-4 rounded-lg p-6">
      <div className="flex flex-col gap-3">
        <div className="border-stroke-light relative border-x-0 border-t-0 border-b-2 border-dashed ps-8 pb-6">
          <span
            className="pointer-events-none absolute inset-s-0 top-4 flex"
            aria-hidden="true"
          >
            <Image src={timeline.src} alt="Timeline" width={15} height={130} />
          </span>
          {[
            [t("pickupAddress"), pickupAddress],
            [t("dropoffAddress"), dropoffAddress],
          ].map(([label, value], index, rows) => (
            <div
              className={cn(
                "flex min-h-14.5 items-center justify-between gap-3 py-2 text-start",
                index < 2 &&
                  "min-h-16.5 flex-col items-stretch justify-center gap-1",
                index === rows.length - 1 && "min-h-10.5",
              )}
              key={label}
            >
              <span className="text-text-subtle text-sm">{label}</span>
              <span className="text-md text-text-primary min-w-0 overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DateValue
        label={t("pickupTime")}
        value={formatDateTime(booking.pickupAt, locale)}
      />
      <DateValue
        label={t("dropoffTime")}
        value={formatDateTime(booking.returnAt, locale)}
      />

      {booking.note ? (
        <div className="bg-surface-card-primary text-text-primary flex items-start gap-3 rounded-md p-3 text-sm leading-relaxed">
          <FiInfo aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="text-text-subtle text-xs font-medium">
              {t("note")}
            </span>
            <span>{booking.note}</span>
          </div>
        </div>
      ) : null}

      {booking.createdAt && <BookingOrderTime createdAt={booking.createdAt} />}
    </div>
  );
}

function DateValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-text-primary border-stroke-light flex items-start gap-3 border-x-0 border-t-0 border-b-2 border-dashed pb-2 text-sm leading-relaxed">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-text-subtle text-sm font-normal">{label}</span>
        <span className="text-text-primary text-base font-medium">{value}</span>
      </div>
    </div>
  );
}
