export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  /** First-level administrative area from the geocoder, e.g. "Riyadh Province". */
  region?: string;
}

/**
 * A remembered place: the guest's browser location or the signed-in
 * customer's saved location. `region` is the geocoder's Arabic name, sent to
 * the backend as it is (the backend matches Arabic region names only).
 */
export interface SavedLocation {
  lat: number;
  lng: number;
  /** From the reverse geocoder; missing until a lookup succeeds. */
  address?: string;
  /** Arabic first-level administrative area, e.g. "منطقة الرياض"; may be missing. */
  region?: string;
}
