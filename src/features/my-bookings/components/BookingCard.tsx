"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OrderListItem } from "@/features/orders";
import { ICONS, IMAGES } from "@/shared/config/assets";
import { ModelYearBadge } from "@/shared/ui/ModelYearBadge";
import BookingStatusBadge from "./BookingStatusBadge";

interface Props {
  booking: OrderListItem;
}

function formatPickupDate(value: string, locale: string): string {
  const date = new Date(value.replace(" ", "T"));
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function BookingCard({ booking }: Props) {
  const locale = useLocale();

  return (
    <Link
      href={`/account/bookings/${booking.id}`}
      className="block overflow-hidden rounded-lg border border-stroke-light bg-surface-elevated text-inherit no-underline transition hover:-translate-y-1 hover:border-action-primary/30 hover:shadow-lg"
    >
      <div className="relative h-42.5 bg-surface-on-background">
        <Image
          src={booking.carImage ?? IMAGES.imageFallback.src}
          alt={booking.carName}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
        />
      </div>

      <div className="p-4 px-4.5 pb-4.5">
        <div className="mb-ds-3 flex items-center justify-between gap-2">
          <h4 className="m-0 text-base font-bold text-text-primary">
            {booking.carName}
          </h4>
          <ModelYearBadge year={booking.carYear} />
        </div>

        <div className="flex flex-col gap-2 border-t border-stroke-light pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <Image
                src={booking.companyLogo ?? IMAGES.officePlaceholder.src}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded object-contain"
              />
              <span className="truncate text-text-primary text-sm ">
                {booking.companyName}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1 text-[0.82rem] font-bold text-gauge-amber">
              <Image
                src={ICONS.starFill.src}
                alt=""
                width={ICONS.starFill.width}
                height={ICONS.starFill.height}
                className="shrink-0"
              />
              {booking.companyRate}
            </span>
          </div>
          <BookingStatusBadge
            status={booking.status}
            dateTime={formatPickupDate(booking.date, locale)}
            lateHours={booking.lateHours}
            className="w-full"
          />
        </div>
      </div>
    </Link>
  );
}
