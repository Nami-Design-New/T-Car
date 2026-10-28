/**
 * The guest's browser location, asked once per browser and kept in
 * localStorage so the endpoints that need it can send it. Browser only: the
 * server cannot read it, so a Server Action that needs it takes it as input.
 */
export const GUEST_LOCATION_KEY = "tcar.guestLocation";

export interface GuestLocation {
  lat: number;
  lng: number;
  /** From the reverse geocoder; missing until a lookup succeeds. */
  address?: string;
  /** First-level administrative area, e.g. "Riyadh Province"; the geocoder may have none. */
  region?: string;
}

/** The answer to the browser prompt; `denied` stops the app from asking again. */
export type GuestLocationRecord =
  | ({ status: "granted"; savedAt: string } & GuestLocation)
  | { status: "denied"; savedAt: string };

const isCoordinate = (value: unknown, limit: number) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= limit;

const isOptionalString = (value: unknown) =>
  value === undefined || typeof value === "string";

function isGuestLocationRecord(value: unknown): value is GuestLocationRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.savedAt !== "string") return false;
  if (record.status === "denied") return true;
  return (
    record.status === "granted" &&
    isCoordinate(record.lat, 90) &&
    isCoordinate(record.lng, 180) &&
    isOptionalString(record.address) &&
    isOptionalString(record.region)
  );
}

/** The stored answer, or null when the guest was never asked (or storage is blocked). */
export function readGuestLocationRecord(): GuestLocationRecord | null {
  try {
    const raw = window.localStorage.getItem(GUEST_LOCATION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isGuestLocationRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/** The guest's location when they allowed location access, else null. */
export function readGuestLocation(): GuestLocation | null {
  const record = readGuestLocationRecord();
  if (record?.status !== "granted") return null;
  const { lat, lng, address, region } = record;
  return { lat, lng, address, region };
}

/** Fired on this page after every save; other tabs get the `storage` event. */
const GUEST_LOCATION_EVENT = "tcar:guest-location";

export function saveGuestLocationRecord(record: GuestLocationRecord): void {
  try {
    window.localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(record));
  } catch {
    // Private mode or blocked storage: the guest is asked again next visit.
  }
  window.dispatchEvent(new Event(GUEST_LOCATION_EVENT));
}

/** Calls `onChange` whenever the stored location changes, here or in another tab. */
export function subscribeGuestLocation(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === GUEST_LOCATION_KEY || event.key === null) onChange();
  };
  window.addEventListener(GUEST_LOCATION_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(GUEST_LOCATION_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
