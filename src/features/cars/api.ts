import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { IMAGES } from "@/shared/config/assets";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
import type {
  CarAvailability,
  CarFilterOption,
  CityCarFilterOptions,
  CarListing,
  CarOffer,
  OfficeCarGroup,
} from "./model";
import {
  COMPANY_CARS_PER_PAGE,
  HOME_OFFER_CARS_PER_PAGE,
  type CityCarsLocation,
  type CityCarsQuery,
} from "./searchParams";

export interface CityCarsApi {
  /** A page of the region's company rows. */
  listCityCars(
    locale: string,
    query: CityCarsQuery,
    page: number,
  ): Promise<Page<OfficeCarGroup>>;
  /** A page of one company's cars in the region (a row loads from page 2). */
  listCompanyCars(
    locale: string,
    companyId: string,
    query: CityCarsQuery,
    page: number,
  ): Promise<Page<CarListing>>;
  getFilterOptions(locale: string): Promise<CityCarFilterOptions>;
  /** A page of the home rail's offers, optionally narrowed by saved location. */
  listHomeOfferCars(
    locale: string,
    page: number,
    perPage: number,
    location?: CityCarsLocation,
  ): Promise<Page<CarListing>>;
  /** A page of the home rail's curated cars, narrowed by saved location. */
  listHomeCarefullyChosenCars(
    locale: string,
    page: number,
    perPage: number,
    location?: CityCarsLocation,
  ): Promise<Page<CarListing>>;
}

interface LookupDto {
  id: number;
  title: string;
  logo: string | null;
}

interface OfferDto {
  id: number;
  description: string;
  type: string;
  require_booking_days: number;
  free_days: number;
  max_distance: number;
}

interface CarListingDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  any_car_branches_support_airport: boolean;
  lower_price: number;
  max_price: number;
  rate: number;
  has_offer: boolean;
  brand: LookupDto;
  type: LookupDto;
  car_model: LookupDto;
  offer: OfferDto | null;
  availability?: {
    booking_types: Record<
      "daily" | "monthly" | "airport" | "station" | "international",
      boolean
    >;
    delivery_types: Record<"to_location" | "from_branch", boolean>;
  };
}

interface CompanyCarsGroupDto {
  company_id: number;
  company_name: string;
  company_logo: string | null;
  cars: CarListingDto[];
}

interface CompanyLookupDto {
  id: number;
  title: string;
  logo_url: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

function isLookup(value: unknown): value is LookupDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === "string" &&
    isNullableString(value.logo)
  );
}

function isCompanyLookup(value: unknown): value is CompanyLookupDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === "string" &&
    isNullableString(value.logo_url)
  );
}

function isOffer(value: unknown): value is OfferDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.type === "string" &&
    isNumber(value.require_booking_days) &&
    isNumber(value.free_days)
  );
}

function isAvailability(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const bookingTypes = value.booking_types;
  const deliveryTypes = value.delivery_types;
  if (!isRecord(bookingTypes) || !isRecord(deliveryTypes)) return false;
  return (
    ["daily", "monthly", "airport", "station", "international"].every(
      (key) => typeof bookingTypes[key] === "boolean",
    ) &&
    ["to_location", "from_branch"].every(
      (key) => typeof deliveryTypes[key] === "boolean",
    )
  );
}

function isCarListing(value: unknown): value is CarListingDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNullableString(value.image_url) &&
    isNumber(value.year) &&
    typeof value.company_name === "string" &&
    isNullableString(value.company_logo) &&
    typeof value.any_car_branches_support_airport === "boolean" &&
    isNumber(value.lower_price) &&
    isNumber(value.rate) &&
    isLookup(value.brand) &&
    isLookup(value.car_model) &&
    (value.offer === null || isOffer(value.offer)) &&
    (value.availability === undefined || isAvailability(value.availability))
  );
}

/** A company and its cars, as `/city-cars` returns them (docs/api/cities-api.md §3.2). */
export function isCompanyCarsGroup(
  value: unknown,
): value is CompanyCarsGroupDto {
  return (
    isRecord(value) &&
    isNumber(value.company_id) &&
    typeof value.company_name === "string" &&
    isNullableString(value.company_logo) &&
    Array.isArray(value.cars) &&
    value.cars.every(isCarListing)
  );
}

/** Only `free_days` is known (Q8); any other type maps to no offer. */
function toCarOffer(offer: OfferDto | null): CarOffer | undefined {
  if (offer?.type !== "free_days" || offer.free_days < 1) return undefined;
  return {
    requiredDays: offer.require_booking_days,
    freeDays: offer.free_days,
  };
}

function toCarAvailability(car: CarListingDto): CarAvailability | undefined {
  const availability = car.availability;
  if (!availability) return undefined;
  return {
    bookingTypes: availability.booking_types,
    deliveryTypes: {
      toLocation: availability.delivery_types.to_location,
      fromBranch: availability.delivery_types.from_branch,
    },
  };
}

export function mapCarListing(car: CarListingDto): CarListing {
  const salePrice = car.lower_price > 0 ? car.lower_price : car.max_price;
  const originalPrice =
    car.lower_price > 0 && car.max_price > car.lower_price
      ? car.max_price
      : undefined;

  return {
    id: String(car.id),
    name: car.car_model.title,
    brand: car.brand.title,
    image: car.image_url || IMAGES.imageFallback.src,
    pricePerDay: salePrice,
    originalPrice,
    rating: car.rate,
    year: car.year,
    showroom: car.company_name,
    showroomLogo: car.company_logo || undefined,
    pickupPoint: car.any_car_branches_support_airport ? "airport" : undefined,
    offer: toCarOffer(car.offer),
    availability: toCarAvailability(car),
  };
}

export function mapCompanyCarsGroup(
  group: CompanyCarsGroupDto,
): OfficeCarGroup {
  return {
    office: {
      id: String(group.company_id),
      slug: String(group.company_id),
      name: group.company_name,
      showroom: group.company_name,
      logo: group.company_logo || IMAGES.imageFallback.src,
    },
    cars: group.cars.map(mapCarListing),
  };
}

/** Companies per page; the API allows 1 to 100 (docs/api/cities-api.md §3.5). */
const CITY_CARS_PER_PAGE = 1;

/** The filters both city car reads share (docs/api/cities-api.md §2). */
function toCityCarsSearch(
  query: CityCarsQuery,
  page: number,
  perPage: number,
): string {
  const search = new URLSearchParams();
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
  search.set("per_page", String(perPage));
  search.set("page", String(page));
  return search.toString();
}

function mapLookup(lookup: LookupDto): CarFilterOption {
  return {
    id: String(lookup.id),
    title: lookup.title,
    logo: lookup.logo || undefined,
  };
}

function mapCompanyLookup(lookup: CompanyLookupDto): CarFilterOption {
  return {
    id: String(lookup.id),
    title: lookup.title,
    logo: lookup.logo_url || undefined,
  };
}

async function listLookup<T>(
  path: string,
  locale: string,
  guard: (value: unknown) => value is T,
  map: (value: T) => CarFilterOption,
): Promise<CarFilterOption[]> {
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `${path}?per_page=100&page=1`,
    { headers: { "Accept-Language": locale } },
  );
  return toCheckedPage(response, guard, map).items;
}

async function getFilterOptions(locale: string): Promise<CityCarFilterOptions> {
  const [brands, types, services, companies] = await Promise.all([
    listLookup("/car-brands", locale, isLookup, mapLookup),
    listLookup("/car-types", locale, isLookup, mapLookup),
    listLookup("/car-additional-services", locale, isLookup, mapLookup),
    listLookup("/companies", locale, isCompanyLookup, mapCompanyLookup),
  ]);
  return { brands, types, services, companies };
}

/** A paginated envelope whose items all pass the guard, or a server error. */
function toCheckedPage<T, D>(
  response: unknown,
  isItem: (value: unknown) => value is D,
  map: (item: D) => T,
): Page<T> {
  if (!isApiEnvelope(response) || response.code !== 200) {
    throw new AppError("server");
  }
  const { data, pagination } = response as ApiEnvelope<unknown> & {
    pagination?: unknown;
  };
  if (
    !Array.isArray(data) ||
    !data.every(isItem) ||
    !isPaginationDto(pagination)
  ) {
    throw new AppError("server");
  }
  return toPage(data.map(map), pagination);
}

/** GET /city-cars: public; one page of companies, each with up to 10 cars. */
async function listCityCars(
  locale: string,
  query: CityCarsQuery,
  page: number,
): Promise<Page<OfficeCarGroup>> {
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/city-cars?${toCityCarsSearch(query, page, CITY_CARS_PER_PAGE)}`,
    { headers: { "Accept-Language": locale } },
  );
  return toCheckedPage(response, isCompanyCarsGroup, mapCompanyCarsGroup);
}

/**
 * GET /city-company-cars: public; one company's cars in the region. Its page 1
 * is the group's cars in `/city-cars`, so a row loads from page 2.
 */
async function listCompanyCars(
  locale: string,
  companyId: string,
  query: CityCarsQuery,
  page: number,
): Promise<Page<CarListing>> {
  const search = new URLSearchParams(
    toCityCarsSearch(query, page, COMPANY_CARS_PER_PAGE),
  );
  search.set("company_id", companyId);
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/city-company-cars?${search}`,
    { headers: { "Accept-Language": locale } },
  );
  return toCheckedPage(response, isCarListing, mapCarListing);
}

/**
 * GET /offer-cars is the home-only offers rail. The endpoint returns cars,
 * unlike GET /cars-listing which returns groups of company rows. Location is
 * optional: it comes from browser localStorage and is omitted when unavailable.
 */
async function listHomeOfferCars(
  locale: string,
  page: number,
  perPage: number,
  location?: CityCarsLocation,
): Promise<Page<CarListing>> {
  const search = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  if (location) {
    search.set("region", location.region);
    search.set("latitude", String(location.latitude));
    search.set("longitude", String(location.longitude));
  }
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/offer-cars?${search}`,
    { headers: { "Accept-Language": locale } },
  );
  return toCheckedPage(response, isCarListing, mapCarListing);
}

/** GET /carfully-choises-cars: curated home cars, with no delivery filter. */
async function listHomeCarefullyChosenCars(
  locale: string,
  page: number,
  perPage: number,
  location?: CityCarsLocation,
): Promise<Page<CarListing>> {
  const search = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  if (location) {
    search.set("region", location.region);
    search.set("latitude", String(location.latitude));
    search.set("longitude", String(location.longitude));
  }
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/carfully-choises-cars?${search}`,
    { headers: { "Accept-Language": locale } },
  );
  return toCheckedPage(response, isCarListing, mapCarListing);
}

export const cityCarsApi: CityCarsApi = {
  listCityCars,
  listCompanyCars,
  getFilterOptions,
  listHomeOfferCars,
  listHomeCarefullyChosenCars,
};
