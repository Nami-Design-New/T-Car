import type { Page } from "@/shared/lib/pagination";

export type RentalType =
  "daily" | "monthly" | "airport" | "station" | "international";

export interface Airport {
  id: number;
  city: string;
  airport: string;
  code?: string;
}

export interface Station {
  id: number;
  station: string;
}

/** For international rentals. */
export interface Country {
  id: number;
  code?: string;
  name: string;
  flag: string;
}

/** The choices the search dialogs offer, loaded once for the hero. */
export interface RentalSearchOptions {
  airports: Page<Airport>;
  stations: Page<Station>;
  countries: Page<Country>;
}

export type RentalDeliveryType = "to_location" | "from_branch";

/**
 * A finished rental-flow choice, as `useRentalFlow` writes it to the `/cars`
 * URL: the type, its own choice (delivery type, airport, station, or country),
 * and, where delivery needs it, the confirmed customer location.
 */
export interface RentalContext {
  type: RentalType;
  deliveryType?: RentalDeliveryType;
  airportId?: string;
  stationId?: string;
  countryId?: string;
  /** Required for daily, monthly, and international; absent for airport/station. */
  lat?: string;
  lng?: string;
  region?: string;
}

const RENTAL_TYPES: readonly RentalType[] = [
  "daily",
  "monthly",
  "airport",
  "station",
  "international",
];
const POSITIVE_ID = /^[1-9]\d*$/;

/**
 * The rental context in a URL, or null when the flow was not finished. The
 * same steps as `useRentalFlow`: daily, monthly, and international pick a
 * delivery type; airport an airport; station a station; international also a
 * country; daily, monthly, and international also need a location with a
 * region. Airport and station identify their pickup point directly.
 */
export function readRentalContext(params: {
  get(name: string): string | null;
}): RentalContext | null {
  const type = params.get("type") as RentalType | null;
  if (!type || !RENTAL_TYPES.includes(type)) return null;

  const raw = params.get("deliveryType");
  const deliveryType: RentalDeliveryType | undefined =
    raw === "to_location" || raw === "from_branch" ? raw : undefined;
  const id = (name: string) => {
    const value = params.get(name);
    return value && POSITIVE_ID.test(value) ? value : undefined;
  };
  const airportId = id("airportId");
  const stationId = id("stationId");
  const countryId = id("countryId");

  if (
    (type === "daily" || type === "monthly" || type === "international") &&
    !deliveryType
  )
    return null;
  if (type === "airport" && !airportId) return null;
  if (type === "station" && !stationId) return null;
  if (type === "international" && !countryId) return null;

  if (type === "airport" || type === "station") {
    return {
      type,
      ...(type === "airport" ? { airportId } : { stationId }),
    };
  }

  const region = params.get("region")?.trim();
  const lat = params.get("lat")?.trim();
  const lng = params.get("lng")?.trim();
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (
    !region ||
    !lat ||
    !lng ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;

  return {
    type,
    ...(deliveryType ? { deliveryType } : {}),
    ...(type === "international" ? { countryId } : {}),
    lat,
    lng,
    region,
  };
}

/** The car-details search params for a context (same keys as the flow). */
export function rentalContextParams(context: RentalContext): URLSearchParams {
  const params = new URLSearchParams({ type: context.type });
  if (context.airportId) params.set("airportId", context.airportId);
  if (context.stationId) params.set("stationId", context.stationId);
  if (context.countryId) params.set("countryId", context.countryId);
  if (context.deliveryType) params.set("deliveryType", context.deliveryType);
  if (context.lat) params.set("lat", context.lat);
  if (context.lng) params.set("lng", context.lng);
  if (context.region) params.set("region", context.region);
  return params;
}

/** Whether a car offers the context's booking type and delivery type. */
export function carSupportsRentalContext(
  availability: {
    bookingTypes: Record<RentalType, boolean>;
    deliveryTypes: { toLocation: boolean; fromBranch: boolean };
  },
  context: RentalContext,
): boolean {
  if (!availability.bookingTypes[context.type]) return false;
  if (context.deliveryType === "to_location")
    return availability.deliveryTypes.toLocation;
  if (context.deliveryType === "from_branch")
    return availability.deliveryTypes.fromBranch;
  return true;
}
