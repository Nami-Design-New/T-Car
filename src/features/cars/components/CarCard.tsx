"use client";

import { Link } from "@/i18n/navigation";
import { IMAGES } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/assets";
import {
  discountPercent as getDiscountPercent,
  type CarListing,
} from "../model";

import { cn } from "@/shared/lib/cn";
import { Price } from "@/shared/ui/Price";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";

const giftImage = IMAGES.gift;
const star = ICONS.starFill;

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
    <article
      className={cn(
        "group h-full min-w-0 overflow-hidden rounded-xl  bg-surface-background shadow-[0_7px_24px_rgba(30,30,30,0.055)] transition duration-300 hover:-translate-y-1 hover:border-action-primary/25 hover:shadow-[0_14px_34px_rgba(30,30,30,0.1)] focus-within:outline-3 focus-within:outline-action-primary/18 focus-within:outline-offset-3 max-sm:rounded-xl",
        className,
      )}
    >
      <Link
        href={detailsHref}
        className=" flex h-full flex-col text-inherit"
        aria-label={t("viewCar", { brand: car.brand, name: car.name })}
      >
        <div className="relative h-52.5 overflow-hidden bg-surface-on-background after:absolute after:bottom-0 after:inset-s-0 after:inset-e-0 after:h-[45%] after:bg-[linear-gradient(to_top,rgba(30,30,30,0.3),transparent)] after:content-[''] max-sm:h-[184px]">
          <Image
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            fill
            sizes={imageSizes}
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />

          {car.pickupPoint ? (
            <span className="absolute inset-s-0 top-0 z-2 inline-flex min-h-7.5 items-center gap-1 rounded-bl-md  bg-surface-card-primary text-action-primary px-3 py-2 text-xs font-normal backdrop-blur-sm">
              {car.pickupPoint === "airport" ? (
                <LuPlane
                  className="text-sm text-action-primary"
                  aria-hidden="true"
                />
              ) : (
                <MdTrain
                  className="text-sm text-action-primary"
                  aria-hidden="true"
                />
              )}
              {car.pickupPoint === "airport"
                ? t("airportPickup")
                : t("stationPickup")}
            </span>
          ) : null}

          {true ? (
            <div className="absolute bottom-1 inset-s-1.25 inset-e-1.25 z-2 flex min-h-12 items-stretch justify-between overflow-hidden rounded-md border border-dashed border-status-success bg-surface-background/[0.94] shadow-[0_8px_22px_rgba(30,30,30,0.14)] backdrop-blur-[10px]">
              <span className="flex min-w-0 items-center gap-3 ">
                <Image
                  src={giftImage.src}
                  alt={t("gift")}
                  width={giftImage.width}
                  height={giftImage.height}
                  className="shrink-0"
                />
                <span className="min-w-0 px-ds-1 py-ds-2 grow">
                  <small className="mb-px block text-xs leading-[1.3] text-text-subtle">
                    {t("limitedOffer")}
                  </small>
                  <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold leading-[1.35] text-ds-green">
                    {t("saveNow")}
                  </strong>
                </span>
              </span>
              <span className="relative grid min-w-17 place-content-center bg-ds-green px-4 py-2 text-center text-white after:absolute after:inset-e-0 after:top-1/2 after:size-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-surface-background/[0.94] after:content-['']">
                <strong className="block text-xl ">1</strong>
                <small className="block text-[10px] leading-none">
                  {t("discount")}
                </small>
              </span>
            </div>
          ) : null}
        </div>

        <div className=" flex flex-1 flex-col p-3 ">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 mb-2  text-base font-bold leading-[1.45] text-text-primary">
              {car.brand} {car.name}
            </h3>
            <span className="shrink-0 rounded-sm bg-surface-card-primary px-3 py-2 text-xs font-semibold leading-none text-action-primary">
              {car.year}
            </span>
          </div>
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-text-subtle">
              <Image
                src={"/mock/offices/office-1.webp"}
                width={44}
                height={44}
                alt=""
                className="size-11 rounded object-cover"
              />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {car.showroom}
              </span>
            </span>
            <span
              className=" inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-text-primary"
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

          <div className="mt-auto flex items-end justify-between gap-4  pt-2">
            <span className="flex min-w-0 items-center gap-4 whitespace-nowrap">
              <span className="inline-flex items-center gap-2">
                <Price
                  amount={car.pricePerDay}
                  amountClassName="text-action-primary text-base font-semibold"
                  className="text-action-primary"
                />
                <small className="whitespace-nowrap text-sm font-bold text-text-subtle">
                  {t("perDay")}
                </small>
              </span>
              {car.originalPrice ? (
                <Price amount={car.originalPrice} strike={true} />
              ) : null}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
