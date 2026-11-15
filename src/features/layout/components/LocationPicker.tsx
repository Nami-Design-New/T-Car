"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import { assignLocationAction } from "@/features/auth";
import {
  readCurrentLocation,
  setUserLocation,
  subscribeCurrentLocation,
} from "@/features/location";
import { useRouter } from "@/i18n/navigation";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { saveGuestLocationRecord } from "@/shared/lib/guest-location";
import type { LocationData } from "@/shared/lib/location";
import { fromActionResult } from "@/shared/lib/result";
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

interface Props {
  /** A signed-in pick is saved to the account; a guest's stays in this browser. */
  signedIn: boolean;
}

/** The current location as the map takes it; the address may still be pending. */
function readCurrentLocationData(): LocationData | null {
  const current = readCurrentLocation();
  return current && { ...current, address: current.address ?? "" };
}

export default function LocationPicker({ signedIn }: Props) {
  const t = useTranslations("layout.location");
  const router = useRouter();
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const saving = useRef(false);

  // Read after hydration, so the server and first render agree.
  useEffect(() => {
    const sync = () => setLocation(readCurrentLocationData());
    sync();
    return subscribeCurrentLocation(sync);
  }, []);

  const saveForGuest = (nextLocation: LocationData) => {
    setLocation(nextLocation);
    setOpen(false);
    saveGuestLocationRecord({
      status: "granted",
      ...nextLocation,
      savedAt: new Date().toISOString(),
    });
  };

  /**
   * Saves to the account (`/assign-location`); the browser location is left
   * as it is. A failure keeps the map open with the pick and toasts the error.
   */
  const saveForCustomer = async (nextLocation: LocationData) => {
    if (saving.current) return;
    saving.current = true;
    try {
      const result = fromActionResult(await assignLocationAction(nextLocation));
      if (!result.ok) {
        notify.error(result.error.serverMessage ?? errorMessage(result.error));
        return;
      }
      const { lat, lng, address, region } = nextLocation;
      setUserLocation({
        lat,
        lng,
        ...(address ? { address } : {}),
        ...(region ? { region } : {}),
      });
      setOpen(false);
      notify.success(result.message);
      // The layout reads the saved location again, so server data agrees.
      router.refresh();
    } finally {
      saving.current = false;
    }
  };

  const handleConfirm = (nextLocation: LocationData) => {
    if (signedIn) void saveForCustomer(nextLocation);
    else saveForGuest(nextLocation);
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
          {location?.address || (signedIn ? t("choose") : t("default"))}
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
