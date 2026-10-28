"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { reverseGeocode } from "@/shared/lib/geocode";
import {
  readGuestLocationRecord,
  saveGuestLocationRecord,
  type GuestLocation,
} from "@/shared/lib/guest-location";

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 10 * 60_000,
};

/**
 * Saves the coordinates at once, then the address and region in the site's
 * language (as `MapLocationModal` does). A failed lookup keeps the coordinates
 * and is retried on the next visit, without asking the guest again.
 */
async function saveWithAddress(location: GuestLocation, language: string) {
  const savedAt = new Date().toISOString();
  const { lat, lng } = location;
  saveGuestLocationRecord({ status: "granted", lat, lng, savedAt });
  const place = await reverseGeocode(location, language);
  if (place) {
    saveGuestLocationRecord({ status: "granted", lat, lng, ...place, savedAt });
  }
}

/**
 * Asks a guest for the browser location once per browser and stores the
 * answer (`shared/lib/guest-location`). Renders nothing. A timeout or an
 * unavailable position is not an answer, so the next visit asks again.
 */
export default function GuestLocationRequest() {
  const locale = useLocale();

  useEffect(() => {
    const record = readGuestLocationRecord();
    if (record) {
      if (record.status === "granted" && !record.address) {
        void saveWithAddress(record, locale);
      }
      return;
    }
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void saveWithAddress(
          { lat: coords.latitude, lng: coords.longitude },
          locale,
        ),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          saveGuestLocationRecord({
            status: "denied",
            savedAt: new Date().toISOString(),
          });
        }
      },
      POSITION_OPTIONS,
    );
  }, [locale]);

  return null;
}
