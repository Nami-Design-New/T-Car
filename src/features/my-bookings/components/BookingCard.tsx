import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FiStar, FiHome } from "react-icons/fi";
import type { UserBooking } from "../model";
import BookingStatusBadge from "./BookingStatusBadge";
import { ICONS } from "@/shared/config/assets";

const startFill = ICONS.starFill;
interface Props {
  booking: UserBooking;
}

export default function BookingCard({ booking }: Props) {
  return (
    <Link
      href={`/account/bookings/${booking.id}`}
      className="block overflow-hidden rounded-lg border border-stroke-light bg-surface-elevated text-inherit no-underline transition hover:-translate-y-1 hover:border-action-primary/30 hover:shadow-lg"
    >
      <div className="relative h-42.5 bg-surface-on-background">
        <Image
          src={booking.carImage}
          alt={booking.carName}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </div>

      <div className="p-4 px-4.5 pb-4.5">
        <div className=" flex items-center justify-between mb-ds-3">
          <h4 className="m-0 text-base font-bold text-text-primary">
            {booking.carBrand} {booking.carName}
          </h4>
          <span className="bg-primary-100 text-xs text-action-primary px-1.5 py-1  rounded-[6px]">
            2022
          </span>
        </div>

        <div className="flex flex-col gap-2 border-t border-stroke-light pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              {booking.showroomLogo ? (
                <Image
                  src={booking.showroomLogo}
                  alt=""
                  width={24}
                  height={24}
                  className="size-8 shrink-0 rounded object-contain"
                />
              ) : (
                <FiHome className="shrink-0" aria-hidden="true" />
              )}
              <span className="truncate text-text-primary text-sm ">
                {booking.showroom}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1 text-[0.82rem] font-bold text-gauge-amber">
              <Image
                src={startFill.src}
                alt="Star"
                width={startFill.width}
                height={startFill.height}
                className="shrink-0"
              />
              {booking.rating}
            </span>
          </div>
          <div className="flex">
            <BookingStatusBadge
              status={booking.status}
              label={booking.statusLabel}
              dateTime={booking.dateLabel}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
