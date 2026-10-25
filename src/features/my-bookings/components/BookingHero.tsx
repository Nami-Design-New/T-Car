import { Price } from "@/shared/ui/Price";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import type { BookingStatus } from "../model";
import BookingStatusBadge from "./BookingStatusBadge";

interface Props {
  carName: string;
  carBrand: string;
  carImage: string;
  showroom: string;

  pricePerDay: number;
  originalPrice?: number;

  status: BookingStatus;
  statusLabel: string;

  pickupDateTime: string;
  dropoffDateTime: string;
}

function formatDateTime(dateTime: string) {
  const date = new Date(dateTime);

  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function BookingHero({
  carName,
  carBrand,
  carImage,
  showroom,
  pricePerDay,
  originalPrice,
  status,
  statusLabel,
  dropoffDateTime,
}: Props) {
  const t = useTranslations("myBookings");
  const bookingDate = formatDateTime(dropoffDateTime);

  return (
    <div className="grid grid-cols-[340px_1fr] overflow-hidden rounded-xl border border-stroke-light bg-surface-elevated max-[860px]:grid-cols-1">
      <div className="relative min-h-75 bg-surface-on-background max-[860px]:min-h-55">
        <Image
          src={carImage}
          alt={carName}
          fill
          sizes="(max-width: 860px) 100vw, 340px"
        />
      </div>

      <div className="flex flex-col justify-center gap-3.5 p-7 px-8 max-[600px]:px-5 max-[600px]:py-5.5">
        <span className="flex items-center gap-1.5 text-[0.85rem] text-text-subtle">
          <FiMapPin size={14} />
          {showroom}
        </span>

        <h2 className="m-0 text-[1.6rem] font-extrabold text-text-primary">
          {carBrand} {carName}
        </h2>

        <div className="flex">
          <BookingStatusBadge
            status={status}
            label={statusLabel}
            dateTime={bookingDate}
          />
        </div>

        <div className="mt-1 flex items-baseline gap-2.5">
          {originalPrice && (
            <span className="text-sm text-text-placeholder line-through">
              <Price amount={originalPrice} size="sm" strike={true} />
            </span>
          )}

          <span className="tabular-nums font-extrabold text-action-primary">
            <Price amount={pricePerDay} size="sm" />
            <small className="ms-1 text-sm font-normal text-text-subtle">
              {t("perDay")}
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}
