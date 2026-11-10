import type { CarListing } from "@/features/cars";

export type CarBookingType =
  "daily" | "monthly" | "airport" | "station" | "international";

export interface CarDetailsQuery {
  location?: {
    region: string;
    latitude: number;
    longitude: number;
  };
  /**
   * From the URL: `to_location` or `from_branch`. The details read sends
   * `from_airport` / `from_station` for airport and station (it rejects a read
   * without a delivery type; E1 and E2 send none for those types).
   */
  deliveryType?: "to_location" | "from_branch" | "from_airport" | "from_station";
  bookingType?: CarBookingType;
  airportId?: string;
  stationId?: string;
  countryId?: string;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const selectedId = (value: string | string[] | undefined) => {
  const id = first(value);
  return id && /^\d+$/.test(id) ? id : undefined;
};

/** Parses the details URL without ever sending a partial saved location. */
export function parseCarDetailsQuery(
  input: SearchParamsInput,
): CarDetailsQuery {
  const region = first(input.region)?.trim();
  const latitudeValue = first(input.lat);
  const longitudeValue = first(input.lng);
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  const type = first(input.type) ?? first(input.booking_type);
  const deliveryType = first(input.deliveryType) ?? first(input.delivery_type);

  const location =
    region &&
    latitudeValue?.trim() &&
    longitudeValue?.trim() &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
      ? { region, latitude, longitude }
      : undefined;

  return {
    ...(location ? { location } : {}),
    ...(deliveryType === "to_location" || deliveryType === "from_branch"
      ? { deliveryType }
      : {}),
    ...(["daily", "monthly", "airport", "station", "international"].includes(
      type ?? "",
    )
      ? { bookingType: type as CarBookingType }
      : {}),
    ...(selectedId(input.airportId ?? input.airport_id)
      ? { airportId: selectedId(input.airportId ?? input.airport_id) }
      : {}),
    ...(selectedId(input.stationId ?? input.station_id)
      ? { stationId: selectedId(input.stationId ?? input.station_id) }
      : {}),
    ...(selectedId(input.countryId ?? input.country_id)
      ? { countryId: selectedId(input.countryId ?? input.country_id) }
      : {}),
  };
}

/**
 * The backend rejects a detail read without booking_type or delivery_type
 * (docs/api/car-details-api.md §6.1, G1/G2), so links without a selected
 * rental context (sitemap, shared links, listings without availability) use
 * daily from-branch. A selected value from the booking flow always wins.
 * Interim until the backend makes both optional for this public read.
 */
export const DEFAULT_BOOKING_TYPE: CarBookingType = "daily";
export const DEFAULT_DELIVERY_TYPE: NonNullable<
  CarDetailsQuery["deliveryType"]
> = "from_branch";

export function withDefaultRentalContext(
  query: CarDetailsQuery,
): CarDetailsQuery {
  // International reads require a country. If the user removes it while the
  // details page is open, do not send an invalid international request.
  const safeQuery =
    query.bookingType === "international" && !query.countryId
      ? { ...query, bookingType: undefined }
      : query;

  const bookingType = safeQuery.bookingType ?? DEFAULT_BOOKING_TYPE;
  // Airport and station have no delivery type of their own; the details read
  // still requires one and accepts from_airport / from_station (probe 2026-11-10).
  const deliveryType =
    bookingType === "airport"
      ? "from_airport"
      : bookingType === "station"
        ? "from_station"
        : (safeQuery.deliveryType ?? DEFAULT_DELIVERY_TYPE);

  return {
    ...safeQuery,
    bookingType,
    deliveryType,
  };
}

/** Returns a canonical URL query when an international context loses its country. */
export function toSafeCarDetailsSearchParams(
  input: SearchParamsInput,
): URLSearchParams | null {
  const query = parseCarDetailsQuery(input);
  if (query.bookingType !== "international" || query.countryId) return null;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, item);
    }
  }

  ["type", "booking_type", "countryId", "country_id"].forEach((key) =>
    search.delete(key),
  );
  search.delete("deliveryType");
  search.delete("delivery_type");
  search.set("booking_type", DEFAULT_BOOKING_TYPE);
  search.set("delivery_type", DEFAULT_DELIVERY_TYPE);
  return search;
}

/** Stable cache key for the server read shared by metadata and the page. */
export function serializeCarDetailsQuery(query: CarDetailsQuery): string {
  return JSON.stringify(query);
}

export function deserializeCarDetailsQuery(value: string): CarDetailsQuery {
  const parsed: unknown = JSON.parse(value);
  return typeof parsed === "object" && parsed !== null
    ? (parsed as CarDetailsQuery)
    : {};
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  /** Legacy mock-only field; live company rates do not provide review text. */
  comment?: string;
}

export interface CompanyRatings {
  average: number;
  count: number;
  reviews: Review[];
}

/** Each entry is one API `content` item: sanitized HTML, rendered as is. */
export interface CarPolicies {
  clientInstructions: string[];
  cancellationPolicies: string[];
}

export interface CarWarranty {
  id: string;
  title: string;
  /** Sanitized HTML from the API `content` field, rendered as is. */
  content: string;
}

export interface AddonService {
  id: string;
  title: string;
  price: number;
  type:
    | "car_service"
    | "driver_service"
    | "company_service"
    | "child_seat_service"
    | "airport_fast_delivery";
  icon: "driver" | "travel" | "shield" | "default";
}

export interface InsuranceOption {
  id: string;
  title: string;
  description: string;
  percentage?: number;
}

export type CarQuickFactKind =
  | "power"
  | "doors"
  | "navigation"
  | "bluetooth"
  | "panorama"
  | "usb"
  | "camera"
  | "sensors"
  | "applePlay";

export interface CarQuickFact {
  kind: CarQuickFactKind;
  value?: string;
}

export interface PickupBranch {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  latitude?: number;
  longitude?: number;
  region?: string;
  placeId?: string;
  logo?: string;
}

/** Where the customer collects the car and the other branches nearby. */
export interface CarPickupInfo {
  nearestBranch?: PickupBranch;
  /** Legacy mock fields retained until the mock is retired. */
  address?: string;
  distanceKm?: number;
  branches?: PickupBranch[];
}

/** Prices keep the API names (`lower_price`, `max_price`). */
export interface CarDetails extends Omit<
  CarListing,
  "pricePerDay" | "originalPrice"
> {
  lowerPrice: number;
  maxPrice: number;
  reviewsCount: number;
  images: string[];
  showroom: string;
  showroomLogo?: string;
  quickFacts: CarQuickFact[];
  warranties: CarWarranty[];
  addons: AddonService[];
  insuranceOptions: InsuranceOption[];
  reviews: Review[];
  pickupInfo: CarPickupInfo;
  /** `branch_data.has_airport` / `has_station`: the company has a branch there (R19). */
  hasAirportBranch: boolean;
  hasStationBranch: boolean;
  /** `allowed_distance`: the branch delivery range in km (to_location). */
  allowedDistanceKm?: number;
}
