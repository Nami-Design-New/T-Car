"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import type { Order } from "@/features/orders";
import { IMAGES } from "@/shared/config/assets";
import { ModelYearBadge } from "@/shared/ui/ModelYearBadge";
import { Price } from "@/shared/ui/Price";
import BookingStatusBadge from "./BookingStatusBadge";

interface Props {
  booking: Order;
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BookingHero({ booking }: Props) {
  const t = useTranslations("myBookings");
  const locale = useLocale();
  const carName = `${booking.car.brand.title} ${booking.car.type.title}`;

  return (
    <div className="border-stroke-light bg-surface-elevated grid grid-cols-[340px_1fr] overflow-hidden rounded-xl border max-[860px]:grid-cols-1">
      <div className="bg-surface-on-background relative min-h-75 max-[860px]:min-h-55">
        <Image
          src={booking.car.imageUrl ?? IMAGES.imageFallback.src}
          alt={carName}
          fill
          sizes="(max-width: 860px) 100vw, 340px"
          className="object-cover"
        />
      </div>

      <div className="flex grow flex-col justify-center gap-3.5 p-7 px-8 max-[600px]:px-5 max-[600px]:py-5.5">
        <div className="flex items-center gap-3">
          <h2 className="text-text-primary items-cente m-0 flex w-full justify-between text-2xl font-extrabold">
            {carName}
          </h2>
          <ModelYearBadge year={booking.car.year} />
        </div>
        <span className="text-text-primary flex items-center gap-1.5 text-[18px]">
          <Image
            src={booking.car.companyLogo ?? IMAGES.imageFallback.src}
            alt={booking.car.companyName}
            width={16}
            height={16}
          />
          {booking.car.companyName}
        </span>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-action-primary font-extrabold tabular-nums">
            <Price
              amount={booking.carPrice}
              amountClassName="text-3xl"
              size="md"
            />
            <small className="text-text-subtle ms-1 text-sm font-semibold">
              {t(booking.bookingType === "monthly" ? "perMonth" : "perDay")}
            </small>
          </span>
        </div>
        <div className="flex w-full">
          <BookingStatusBadge
            status={booking.status}
            dateTime={formatDateTime(booking.pickupAt, locale)}
            lateHours={booking.lateHours}
          />
        </div>
      </div>
    </div>
  );
}
