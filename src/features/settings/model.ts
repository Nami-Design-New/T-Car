/** A company size the Join Us form offers. */
export interface CompanySize {
  /** Sent as `company_size_id`. */
  id: string;
  /** Shown to the user, e.g. 10. */
  size: number;
}

/**
 * T-Car's contact details, shown in the home Contact card and the footer. A
 * field the API leaves out (or sends in an unusable form) is absent and hidden.
 */
export interface ContactSettings {
  email?: string;
  /** As the API sends it, e.g. +966500000000. */
  phone?: string;
  /** Absolute http(s) URLs. */
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

/**
 * The backend's pages, in the request's language: about (the footer), terms
 * and privacy (the footer and the register form). Absent when not usable.
 */
export interface SiteLinks {
  aboutUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export type BookingType =
  "daily" | "monthly" | "station" | "airport" | "international";

export type BookingTypeAvailability = Record<BookingType, boolean>;

export const BOOKING_TYPES: readonly BookingType[] = [
  "daily",
  "monthly",
  "station",
  "airport",
  "international",
];

export const DEFAULT_BOOKING_TYPES: BookingTypeAvailability = {
  daily: true,
  monthly: true,
  station: true,
  airport: true,
  international: true,
};

function isBookingType(value: string): value is BookingType {
  return BOOKING_TYPES.includes(value as BookingType);
}

export function isBookingTypeEnabled(
  value: string | undefined,
  availability: BookingTypeAvailability,
): boolean {
  return !value || !isBookingType(value) || availability[value];
}

export interface PriceFilterRange {
  min: number;
  max: number;
}

export const DEFAULT_PRICE_FILTER_RANGE: PriceFilterRange = {
  min: 5,
  max: 55,
};

export interface MapDefaultPosition {
  lat: number;
  lng: number;
}

/**
 * The app settings from GET /settings. Only the fields the app uses are mapped;
 * Add fields here and to the mapper in `api.ts` as web features adopt them.
 */
export interface AppSettings {
  companySizes: CompanySize[];
  contact: ContactSettings;
  links: SiteLinks;
  bookingTypes?: Partial<Record<BookingType, boolean>>;
  priceFilterRange?: PriceFilterRange;
  mapDefaultPosition?: MapDefaultPosition;
}

/** What every page needs from the settings: the contact details and the site links. */
export type SiteSettings = Pick<AppSettings, "contact" | "links"> & {
  priceFilterRange: PriceFilterRange;
};
