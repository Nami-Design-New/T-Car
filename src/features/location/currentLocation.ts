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

const sameLocation = (a: SavedLocation | null, b: SavedLocation | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.lat === b.lat &&
    a.lng === b.lng &&
    a.address === b.address &&
    a.region === b.region);

const sameSource = (a: LocationSource, b: LocationSource) =>
  a.kind === "guest"
    ? b.kind === "guest"
    : b.kind === "user" && sameLocation(a.location, b.location);

/**
 * Written only in the browser (`UserLocationSync` in an effect, and the header
 * picker after a save), so the module store on the server stays at `guest` and
 * is never shared between requests. An equal source is ignored, so the
 * layout's refreshed copy of a just-saved location triggers no second request.
 */
export const useLocationSourceStore = create<LocationSourceState>()((set) => ({
  source: { kind: "guest" },
  setSource: (source) =>
    set((state) => (sameSource(state.source, source) ? state : { source })),
}));

/** The signed-in customer's location after a save (`/assign-location` succeeded). */
export function setUserLocation(location: SavedLocation): void {
  useLocationSourceStore.getState().setSource({ kind: "user", location });
}

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
