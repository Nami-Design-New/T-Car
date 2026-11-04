"use client";

import { Link } from "@/i18n/navigation";
import { IMAGES } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/assets";
import type { CarListing } from "../model";
import CarOfferBadge from "./CarOfferBadge";

import { cn } from "@/shared/lib/cn";
import { Price } from "@/shared/ui/Price";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";

const star = ICONS.starFill;

export interface CarCardProps {
  car: CarListing;
  className?: string;
  imageSizes?: string;
  priority?: boolean;
  /** Lets contextual listings begin their booking flow instead of navigating. */
  onSelect?: (car: CarListing) => void;
}

export default function CarCard({
  car,
  className,
  imageSizes = "(max-width: 767px) 86vw, (max-width: 1199px) 45vw, 350px",
  priority = false,
  onSelect,
}: CarCardProps) {
  const t = useTranslations("carCard");
  const detailsHref = `/cars/${car.id}` as const;
  const { offer } = car;

  return (
    <article
      className={cn(
        "group bg-surface-background hover:border-action-primary/25 focus-within:outline-action-primary/18 h-full min-w-0 overflow-hidden rounded-xl shadow-[0_7px_24px_rgba(30,30,30,0.055)] transition duration-300 focus-within:outline-3 focus-within:outline-offset-3 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(30,30,30,0.1)] max-sm:rounded-xl",
        className,
      )}
    >
      <Link
        href={detailsHref}
        onClickCapture={(event) => {
          // A listing without availability cannot start the rental flow, so it
          // keeps its normal details-page navigation.
          if (!onSelect || !car.availability) return;
          event.preventDefault();
          event.stopPropagation();
          onSelect(car);
        }}
        className="flex h-full flex-col text-inherit"
        aria-label={t("viewCar", { brand: car.brand, name: car.name })}
      >
        <div className="bg-surface-on-background relative h-52.5 overflow-hidden after:absolute after:inset-s-0 after:inset-e-0 after:bottom-0 after:h-[45%] after:bg-[linear-gradient(to_top,rgba(30,30,30,0.3),transparent)] after:content-[''] max-sm:h-46">
          <Image
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            fill
            sizes={imageSizes}
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />

          {car.pickupPoint ? (
            <span className="bg-surface-card-primary text-action-primary absolute inset-s-0 top-0 z-2 inline-flex min-h-7.5 items-center gap-1 rounded-ee-md px-3 py-2 text-xs font-normal backdrop-blur-sm">
              {car.pickupPoint === "airport" ? (
                <LuPlane
                  className="text-action-primary text-sm"
                  aria-hidden="true"
                />
              ) : (
                <MdTrain
                  className="text-action-primary text-sm"
                  aria-hidden="true"
                />
              )}
              {car.pickupPoint === "airport"
                ? t("airportPickup")
                : t("stationPickup")}
            </span>
          ) : null}

          {offer ? <CarOfferBadge offer={offer} /> : null}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-text-primary m-0 mb-2 text-base leading-[1.45] font-bold">
              {car.brand} {car.name}
            </h3>
            <span className="bg-surface-card-primary text-action-primary shrink-0 rounded-sm px-3 py-2 text-xs leading-none font-semibold">
              {car.year}
            </span>
          </div>
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <span className="text-text-subtle flex min-w-0 flex-1 items-center gap-2 text-xs font-medium">
              <Image
                src={car.showroomLogo ?? IMAGES.officePlaceholder.src}
                width={IMAGES.officePlaceholder.width}
                height={IMAGES.officePlaceholder.height}
                alt=""
                className="size-11 rounded object-cover"
              />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {car.showroom}
              </span>
            </span>
            <span
              className="text-text-primary inline-flex shrink-0 items-center gap-1 text-xs font-semibold"
              aria-label={t("rating", { rating: car.rating })}
            >
              <Image
                src={star.src}
                width={star.width}
                height={star.height}
                alt="Star"
              />
              <span>{car.rating}</span>
            </span>
          </div>

          {car.pricePerDay > 0 && (
            <div className="mt-auto flex items-end justify-between gap-4 pt-2">
              <span className="flex min-w-0 items-center gap-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-2">
                  <Price
                    amount={car.pricePerDay}
                    amountClassName="text-action-primary text-base font-semibold"
                    className="text-action-primary"
                  />
                  <small className="text-text-subtle text-sm font-bold whitespace-nowrap">
                    {t("perDay")}
                  </small>
                </span>
                {car.originalPrice ? (
                  <Price amount={car.originalPrice} strike={true} />
                ) : null}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
