"use client";

import { useEffect } from "react";
import type { SavedLocation } from "@/shared/lib/location";
import { useLocationSourceStore } from "../currentLocation";

interface Props {
  signedIn: boolean;
  /** The customer's saved location from GET /profile; null for a guest or none saved. */
  location: SavedLocation | null;
}

/**
 * Puts the root layout's session and saved location into the store. An
 * effect, so it runs in the browser only. Rendered before the page so its
 * effect runs before the pages' first location-based requests.
 */
export function UserLocationSync({ signedIn, location }: Props) {
  const setSource = useLocationSourceStore((state) => state.setSource);
  const lat = location?.lat;
  const lng = location?.lng;
  const address = location?.address;
  const region = location?.region;

  useEffect(() => {
    if (!signedIn) {
      setSource({ kind: "guest" });
      return;
    }
    setSource({
      kind: "user",
      location:
        lat === undefined || lng === undefined
          ? null
          : {
              lat,
              lng,
              ...(address ? { address } : {}),
              ...(region ? { region } : {}),
            },
    });
  }, [setSource, signedIn, lat, lng, address, region]);

  return null;
}
