import type { CarListing, OfficeCarGroup } from "./model";

export interface PriceRange {
  min: number;
  max: number;
}

export type CarSort = "recommended" | "price_asc" | "price_desc" | "rating";

export interface CarFilterDraft {
  query: string;
  minPrice: number;
  maxPrice: number;
  brandIds: string[];
  types: string[];
  companyIds: string[];
  serviceIds: string[];
}

export interface CarSearchParams {
  query: string;
  /** 0 when the filter starts at the site range's minimum (no lower bound). */
  minPrice: number;
  /** Infinity when the filter ends at the site range's maximum (no upper bound). */
  maxPrice: number;
  brandIds: string[];
  types: string[];
  companyIds: string[];
  serviceIds: string[];
  sort: CarSort;
  /** Search context sent by the hero and preserved for the real API. */
  context: Record<string, string>;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.round(parsed), min), max)
    : fallback;
}

function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? value.split(",") : [];
  return [
    ...new Set(
      values
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function createDefaultCarFilters(
  priceRange: PriceRange,
): CarFilterDraft {
  return {
    query: "",
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    brandIds: [],
    types: [],
    companyIds: [],
    serviceIds: [],
  };
}

export function parseCarFilterDraft(
  input: SearchParamsInput,
  priceRange: PriceRange,
): CarFilterDraft {
  const minPrice = boundedNumber(
    first(input.priceMin),
    priceRange.min,
    priceRange.min,
    priceRange.max - 1,
  );

  return {
    query: first(input.q)?.trim() ?? "",
    minPrice,
    maxPrice: boundedNumber(
      first(input.priceMax),
      priceRange.max,
      minPrice + 1,
      priceRange.max,
    ),
    brandIds: list(input.brands),
    types: list(input.types),
    companyIds: list(input.companies),
    serviceIds: list(input.services),
  };
}

export function applyCarFilterDraft(
  params: URLSearchParams,
  filters: CarFilterDraft,
  priceRange: PriceRange,
) {
  const keys = [
    "q",
    "priceMin",
    "priceMax",
    "brands",
    "types",
    "companies",
    "services",
  ];
  keys.forEach((key) => params.delete(key));
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.minPrice !== priceRange.min)
    params.set("priceMin", String(filters.minPrice));
  if (filters.maxPrice !== priceRange.max)
    params.set("priceMax", String(filters.maxPrice));
  if (filters.brandIds.length) params.set("brands", filters.brandIds.join(","));
  if (filters.types.length) params.set("types", filters.types.join(","));
  if (filters.companyIds.length)
    params.set("companies", filters.companyIds.join(","));
  if (filters.serviceIds.length)
    params.set("services", filters.serviceIds.join(","));
  return params;
}

export function parseCarSearchParams(
  input: SearchParamsInput,
  priceRange: PriceRange,
): CarSearchParams {
  const filters = parseCarFilterDraft(input, priceRange);
  const sort = first(input.sort);

  const context: Record<string, string> = {};
  for (const key of [
    "type",
    "city",
    "branch",
    "lat",
    "lng",
    "from",
    "to",
    "airportId",
    "stationId",
    "countryId",
    "pickupDate",
    "dropoffDate",
  ]) {
    const value = first(input[key]);
    if (value) context[key] = value;
  }

  // The full site range means "any price": the slider's edges are not limits,
  // so cars priced outside the settings range still list.
  return {
    ...filters,
    minPrice: filters.minPrice > priceRange.min ? filters.minPrice : 0,
    maxPrice:
      filters.maxPrice < priceRange.max
        ? filters.maxPrice
        : Number.POSITIVE_INFINITY,
    sort:
      sort === "price_asc" || sort === "price_desc" || sort === "rating"
        ? sort
        : "recommended",
    context,
  };
}

/**
 * Cars per company page. A `/city-cars` group holds the company's first 10
 * cars, which are page 1 of `/city-company-cars` at this size (observed
 * 2026-11-03), so a full group means a row may have more.
 */
export const COMPANY_CARS_PER_PAGE = 10;

/** The filters GET /city-cars accepts (docs/api/cities-api.md §2). */
export interface CityCarsQuery {
  /** The guest's saved region. Coordinates and region travel as one tuple. */
  region?: string;
  latitude?: number;
  longitude?: number;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  /** `Y-m-d`; sent only together with `toDay`, which is after it. */
  fromDay?: string;
  toDay?: string;
  brandIds?: string[];
  typeIds?: string[];
  serviceIds?: string[];
  companyIds?: string[];
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Open price bounds (the full site range) are left out, except that a maximum
 * always goes with a minimum (0 when open): the API rejects `max_price` alone
 * with a 422. The dates only go as a valid pair: the API rejects a lone date
 * or one not after the other.
 */
export interface CityCarsLocation {
  region: string;
  latitude: number;
  longitude: number;
}

/** Adds a saved location only when all location fields are available. */
export function withCityCarsLocation(
  query: CityCarsQuery,
  location: CityCarsLocation | null,
): CityCarsQuery {
  if (
    !location ||
    !location.region.trim() ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return query;
  }

  return { ...query, ...location };
}

/** Serializes the shared city-car filters for the browser GET route. */
export function toCityCarsSearchParams(
  query: CityCarsQuery,
  page: number,
  perPage: number,
  companyId?: string,
): URLSearchParams {
  const search = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  if (query.region !== undefined) search.set("region", query.region);
  if (query.latitude !== undefined)
    search.set("latitude", String(query.latitude));
  if (query.longitude !== undefined)
    search.set("longitude", String(query.longitude));
  if (query.query) search.set("search", query.query);
  if (query.minPrice !== undefined)
    search.set("min_price", String(query.minPrice));
  if (query.maxPrice !== undefined)
    search.set("max_price", String(query.maxPrice));
  if (query.fromDay && query.toDay) {
    search.set("from_day", query.fromDay);
    search.set("to_day", query.toDay);
  }
  const appendIds = (key: string, ids: string[] | undefined) =>
    ids?.forEach((id, index) => search.append(`${key}[${index}]`, id));
  appendIds("brand_id", query.brandIds);
  appendIds("type_id", query.typeIds);
  appendIds("service_id", query.serviceIds);
  appendIds("company_id", query.companyIds);
  if (companyId) search.set("company_id", companyId);
  return search;
}

export function toCityCarsQuery(params: CarSearchParams): CityCarsQuery {
  const { pickupDate, dropoffDate } = params.context;
  const datesValid =
    pickupDate !== undefined &&
    dropoffDate !== undefined &&
    ISO_DAY.test(pickupDate) &&
    ISO_DAY.test(dropoffDate) &&
    dropoffDate > pickupDate;

  return {
    ...(params.query ? { query: params.query } : {}),
    ...(params.minPrice > 0 || Number.isFinite(params.maxPrice)
      ? { minPrice: params.minPrice }
      : {}),
    ...(Number.isFinite(params.maxPrice) ? { maxPrice: params.maxPrice } : {}),
    ...(datesValid ? { fromDay: pickupDate, toDay: dropoffDate } : {}),
    ...(params.brandIds.length ? { brandIds: params.brandIds } : {}),
    ...(params.types.length ? { typeIds: params.types } : {}),
    ...(params.serviceIds.length ? { serviceIds: params.serviceIds } : {}),
    ...(params.companyIds.length ? { companyIds: params.companyIds } : {}),
  };
}

export function filterAndSortCars(
  cars: CarListing[],
  params: CarSearchParams,
): CarListing[] {
  const query = params.query.toLocaleLowerCase();
  const filtered = cars.filter((car) => {
    const searchable =
      `${car.name} ${car.brand} ${car.showroom}`.toLocaleLowerCase();
    return (
      car.pricePerDay >= params.minPrice &&
      car.pricePerDay <= params.maxPrice &&
      (!query || searchable.includes(query))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "price_asc":
        return a.pricePerDay - b.pricePerDay;
      case "price_desc":
        return b.pricePerDay - a.pricePerDay;
      case "rating":
        return b.rating - a.rating;
      default:
        return b.rating - a.rating;
    }
  });
}

export function filterOfficeGroups(
  groups: OfficeCarGroup[],
  params: CarSearchParams,
): OfficeCarGroup[] {
  return groups
    .map((group) => ({ ...group, cars: filterAndSortCars(group.cars, params) }))
    .filter((group) => group.cars.length > 0);
}
