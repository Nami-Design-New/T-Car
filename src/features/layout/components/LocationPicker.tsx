"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import type { LocationData } from "@/shared/lib/location";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";
const locationIcon = ICONS.locationChip;

const MapLocationModal = dynamic(
  () =>
    import("@/shared/ui/MapLocationModal").then(
      ({ MapLocationModal }) => MapLocationModal,
    ),
  { ssr: false },
);

export default function LocationPicker() {
  const t = useTranslations("layout.location");
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleConfirm = (nextLocation: LocationData) => {
    setLocation(nextLocation);
    setOpen(false);
  };

  return (
    <div className="location-picker min-w-0 flex-[0_1_300px] max-xl:basis-57.5 max-md:flex-1">
      <button
        type="button"
        className=" flex min-h-8 bg-surface-card-primary! cursor-pointer  w-[min(300px,100%)] outline-0 border-0 items-center gap-2.5 rounded-full  text-text-primary transition duration-300 hover:bg-primary-100/80 hover:text-action-primary focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-3 active:scale-[0.98]  "
        aria-label={t("choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Image
          src={locationIcon.src}
          width={locationIcon.width}
          height={locationIcon.height}
          alt={t("locationIconAlt")}
          className=" shrink-0 size-4 "
          aria-hidden="true"
        />

        <span className="location-picker-address min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold gap-ds-2 p-ds-3">
          {location?.address || t("default")}
        </span>
        <FiChevronDown
          className="location-picker-chevron ms-auto shrink-0 text-xl text-text-subtle"
          aria-hidden="true"
        />
      </button>

      {open && (
        <MapLocationModal
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
          initialLocation={location}
        />
      )}
    </div>
  );
}
