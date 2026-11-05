"use client";

import {
  FiBluetooth,
  FiCamera,
  FiGrid,
  FiNavigation,
  FiSmartphone,
  FiSun,
  FiWifi,
  FiZap,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import { LuPlane } from "react-icons/lu";
import { MdTrain } from "react-icons/md";
import { ModelYearBadge } from "@/shared/ui/ModelYearBadge";
import type { CarDetails } from "../model";
import Image from "next/image";
import { IMAGES } from "@/shared/config/assets";

const FACT_ICONS = {
  power: FiZap,
  doors: FiGrid,
  navigation: FiNavigation,
  bluetooth: FiBluetooth,
  panorama: FiSun,
  usb: FiWifi,
  camera: FiCamera,
  sensors: FiNavigation,
  applePlay: FiSmartphone,
};

interface Props {
  car: CarDetails;
}

export default function CarQuickInfo({ car }: Props) {
  const t = useTranslations("carDetails");
  const quickFactLabel = (fact: CarDetails["quickFacts"][number]) =>
    fact.value
      ? t(`quickFacts.${fact.kind}`, { value: fact.value })
      : t(`quickFacts.${fact.kind}`);

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="w-full">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-text-primary m-0 text-[2rem] leading-[1.3] font-extrabold">
              {car.brand} {car.name}
            </h1>
            <ModelYearBadge year={car.year} />
          </div>

          <p className="text-text-primary mt-2 inline-flex items-center gap-2 text-base font-normal">
            <Image
              src={car.showroomLogo ?? IMAGES.officePlaceholder.src}
              width={IMAGES.officePlaceholder.width}
              height={IMAGES.officePlaceholder.height}
              alt=""
              className="size-6 rounded object-cover"
            />
            {car.showroom}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {car.pickupPoint && (
          <span className="fact pickup bg-surface-card-primary text-action-primary inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold">
            {car.pickupPoint === "airport" ? (
              <LuPlane className="text-action-primary text-[17px]" />
            ) : (
              <MdTrain className="text-action-primary text-[17px]" />
            )}
            {car.pickupPoint === "airport"
              ? t("airportPickup")
              : t("stationPickup")}
          </span>
        )}

        {car.quickFacts.map((fact) => {
          const Icon = FACT_ICONS[fact.kind];
          return (
            <span
              key={fact.kind}
              className="text-base-dark-900 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm"
            >
              <Icon className="text-action-primary text-[17px]" />{" "}
              {quickFactLabel(fact)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
