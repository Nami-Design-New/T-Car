"use client";

import { create } from "zustand";
import {
  readGuestLocation,
  subscribeGuestLocation,
} from "@/shared/lib/guest-location";
import type { SavedLocation } from "@/shared/lib/location";

/** Where the current location comes from: the browser, or the signed-in customer's profile. */
export type LocationSource =
  { kind: "guest" } | { kind: "user"; location: SavedLocation | null };

interface LocationSourceState {
  source: LocationSource;
  setSource: (source: LocationSource) => void;
}

/**
 * Written only in the browser (`UserLocationSync`, in an effect), so the module
 * store on the server stays at `guest` and is never shared between requests.
 */
export const useLocationSourceStore = create<LocationSourceState>()((set) => ({
  source: { kind: "guest" },
  setSource: (source) => set({ source }),
}));

/**
 * The location public requests send: the signed-in customer's saved location
 * (null when they have none, never the browser's), else the guest's browser
 * location. Browser only.
 */
export function readCurrentLocation(): SavedLocation | null {
  const { source } = useLocationSourceStore.getState();
  return source.kind === "user" ? source.location : readGuestLocation();
}

/**
 * Calls `onChange` when the current location may have changed: the source
 * changes (sign-in, sign-out, a new saved location), or, for a guest, the
 * browser location changes here or in another tab.
 */
export function subscribeCurrentLocation(onChange: () => void): () => void {
  const stopGuest = subscribeGuestLocation(() => {
    if (useLocationSourceStore.getState().source.kind === "guest") onChange();
  });
  const stopSource = useLocationSourceStore.subscribe((state, previous) => {
    if (state.source !== previous.source) onChange();
  });
  return () => {
    stopGuest();
    stopSource();
  };
}
