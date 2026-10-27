export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  /** First-level administrative area from the geocoder, e.g. "Riyadh Province". */
  region?: string;
}
