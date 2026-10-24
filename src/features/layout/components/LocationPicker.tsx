"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import type { LocationData } from "@/shared/lib/location";

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
    <div className="location-picker min-w-0 flex-[0_1_300px] max-xl:basis-[230px] max-md:flex-1">
      <button
        type="button"
        className="location-picker-trigger flex h-[52px] w-[min(300px,100%)] items-center gap-2.5 rounded-full bg-surface-card-primary text-text-primary transition duration-300 hover:bg-primary-100/80 hover:text-action-primary focus-visible:outline-3 focus-visible:outline-action-primary/20 focus-visible:outline-offset-3 active:scale-[0.98] max-xl:w-[230px] max-md:h-[46px] max-md:w-full max-md:max-w-[230px] max-md:px-3"
        aria-label={t("choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <FiMapPin className="location-picker-icon shrink-0 text-[28px] text-action-primary max-md:text-2xl" aria-hidden="true" />
        <span className="location-picker-address min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold max-md:text-sm">
          {location?.address || t("default")}
        </span>
        <FiChevronDown className="location-picker-chevron ms-auto shrink-0 text-xl text-text-subtle" aria-hidden="true" />
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
