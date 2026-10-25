"use client";

import { Link } from "@/i18n/navigation";
import {
  discountPercent as getDiscountPercent,
  type CarListing,
} from "../model";
import { IMAGES } from "@/shared/config/assets";
const giftImage = IMAGES.gift;
import { ICONS } from "@/shared/config/assets";
const RiyalIcon = ICONS.riyal;
import { cn } from "@/shared/lib/cn";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FaStar } from "react-icons/fa6";
import { FiMapPin } from "react-icons/fi";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export interface CarCardProps {
  car: CarListing;
  className?: string;
  imageSizes?: string;
  priority?: boolean;
}

export default function CarCard({
  car,
  className,
  imageSizes = "(max-width: 767px) 86vw, (max-width: 1199px) 45vw, 350px",
  priority = false,
}: CarCardProps) {
  const t = useTranslations("carCard");
  const detailsHref = `/cars/${car.id}` as const;
  const discountPercent = getDiscountPercent(car);

  return (
    <article className={cn("car-card group h-full min-w-0 overflow-hidden rounded-xl border border-stroke-light bg-surface-background shadow-[0_7px_24px_rgba(30,30,30,0.055)] transition duration-300 hover:-translate-y-1 hover:border-action-primary/25 hover:shadow-[0_14px_34px_rgba(30,30,30,0.1)] focus-within:outline-3 focus-within:outline-action-primary/18 focus-within:outline-offset-3 max-sm:rounded-xl", className)}>
      <Link
        href={detailsHref}
        className="car-card__link flex h-full flex-col text-inherit"
        aria-label={t("viewCar", { brand: car.brand, name: car.name })}
      >
        <div className="car-card__media relative h-[210px] overflow-hidden bg-surface-on-background after:absolute after:bottom-0 after:start-0 after:end-0 after:h-[45%] after:bg-[linear-gradient(to_top,rgba(30,30,30,0.3),transparent)] after:content-[''] max-sm:h-[184px]">
          <Image
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            fill
            sizes={imageSizes}
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />

          {car.pickupPoint ? (
            <span className="car-card__pickup absolute start-4 top-4 z-[2] inline-flex min-h-[30px] items-center gap-1 rounded-sm border border-white/70 bg-surface-background/[0.92] px-3 py-2 text-[11px] font-semibold text-text-primary shadow-[0_4px_12px_rgba(30,30,30,0.1)] backdrop-blur-[8px]">
              {car.pickupPoint === "airport" ? (
                <LuPlane className="text-sm text-action-primary" aria-hidden="true" />
              ) : (
                <MdTrain className="text-sm text-action-primary" aria-hidden="true" />
              )}
              {car.pickupPoint === "airport"
                ? t("airportPickup")
                : t("stationPickup")}
            </span>
          ) : null}

          {discountPercent ? (
            <div className="car-card__offer absolute bottom-4 start-4 end-4 z-[2] flex min-h-12 items-stretch justify-between overflow-hidden rounded-md border border-dashed border-status-success bg-surface-background/[0.94] shadow-[0_8px_22px_rgba(30,30,30,0.14)] backdrop-blur-[10px]">
              <span className="car-card__offer-copy flex min-w-0 items-center gap-3 px-4 py-3">
                <Image src={giftImage} alt={t("gift")} className="size-6 shrink-0" />
                <span className="min-w-0">
                  <small className="mb-px block text-[9px] leading-[1.3] text-text-subtle">{t("limitedOffer")}</small>
                  <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold leading-[1.35] text-text-primary">{t("saveNow")}</strong>
                </span>
              </span>
              <span className="car-card__offer-value relative grid min-w-[68px] place-content-center bg-status-success px-4 py-2 text-center text-white after:absolute after:start-0 after:top-1/2 after:size-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-surface-background/[0.94] after:content-['']">
                <strong className="block text-[15px] leading-[1.1]">{discountPercent}%</strong>
                <small className="mt-0.5 block text-[8px] leading-none">{t("discount")}</small>
              </span>
            </div>
          ) : null}
        </div>

        <div className="car-card__content flex flex-1 flex-col p-5 max-sm:px-5 max-sm:pb-5 max-sm:pt-4">
          <h3 className="car-card__title mb-4 text-base font-bold leading-[1.45] text-text-primary">
            {car.brand} {car.name}
          </h3>

          <div className="car-card__meta mb-5 flex min-w-0 items-center gap-3">
            <span className="car-card__showroom flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-text-subtle">
              <FiMapPin className="shrink-0 rounded-xs bg-action-primary p-1 text-lg text-white" aria-hidden="true" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{car.showroom}</span>
            </span>
            <span className="car-card__year shrink-0 rounded-sm bg-surface-card-primary px-3 py-2 text-[11px] font-semibold leading-none text-action-primary">{car.year}</span>
          </div>

          <div className="car-card__footer mt-auto flex items-end justify-between gap-4 border-t border-stroke-light pt-4">
            <span className="car-card__price flex min-w-0 items-center gap-4 whitespace-nowrap">
              <span className="car-card__current-price inline-flex items-center gap-2">
                <strong className="text-lg font-bold text-action-primary">{priceFormatter.format(car.pricePerDay)}</strong>
                <Image
                  src={RiyalIcon}
                  alt={t("currency")}
                  className="car-card__riyal-icon h-auto w-4 shrink-0"
                />
                <small className="whitespace-nowrap text-sm font-bold text-text-subtle">{t("perDay")}</small>
              </span>
              {car.originalPrice ? (
                <del className="car-card__old-price inline-flex items-center gap-2 text-sm font-medium leading-none text-text-placeholder decoration-current decoration-[1.5px]">
                  <span>{priceFormatter.format(car.originalPrice)}</span>
                  <Image
                    src={RiyalIcon}
                    alt={t("currency")}
                    className="car-card__riyal-icon h-auto w-4 shrink-0"
                  />
                </del>
              ) : null}
            </span>
            <span
              className="car-card__rating inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-text-primary"
              aria-label={t("rating", { rating: car.rating })}
            >
              <span>{car.rating}</span>
              <FaStar className="text-[15px] text-status-warning" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
