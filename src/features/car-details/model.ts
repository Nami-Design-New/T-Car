import type { CarListing } from "@/features/cars";

export type CarBookingType =
  "daily" | "monthly" | "airport" | "station" | "international";

export interface CarDetailsQuery {
  location?: {
    region: string;
    latitude: number;
    longitude: number;
  };
  deliveryType?: "to_location" | "from_branch";
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
  const type = first(input.type);
  const deliveryType = first(input.deliveryType);

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
    ...(selectedId(input.airportId)
      ? { airportId: selectedId(input.airportId) }
      : {}),
    ...(selectedId(input.stationId)
      ? { stationId: selectedId(input.stationId) }
      : {}),
    ...(selectedId(input.countryId)
      ? { countryId: selectedId(input.countryId) }
      : {}),
  };
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
  comment: string;
}

export interface CarWarranty {
  id: string;
  title: string;
  description: string;
}

export interface AddonService {
  id: string;
  title: string;
  price: number;
  icon: "external" | "driver";
}

export interface InsuranceOption {
  id: string;
  title: string;
  subtitle: string;
  pricePerDay: number;
  terms: string[];
  cancellationPolicy: string[];
}

export interface PickupBranch {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
}

/** Where the customer collects the car and the other branches nearby. */
export interface CarPickupInfo {
  address: string;
  distanceKm: number;
  branches: PickupBranch[];
}

export interface CarDetails extends CarListing {
  reviewsCount: number;
  images: string[];
  showroom: string;
  showroomLogo?: string;
  quickFacts: { icon: "shield" | "delivery" | "distance"; label: string }[];
  warranties: CarWarranty[];
  addons: AddonService[];
  insuranceOptions: InsuranceOption[];
  reviews: Review[];
  pickupInfo: CarPickupInfo;
}
