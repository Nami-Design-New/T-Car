import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { isPaginationDto, toPage, type Page } from "@/shared/lib/pagination";
import type { Airport, Country, RentalSearchOptions, Station } from "./model";

export interface RentalSearchApi {
  listAirports(request: LookupRequest): Promise<Page<Airport>>;
  listStations(request: LookupRequest): Promise<Page<Station>>;
  listCountries(request: LookupRequest): Promise<Page<Country>>;
  getOptions(locale?: string): Promise<RentalSearchOptions>;
}

export interface LookupRequest {
  page: number;
  perPage: number;
  search?: string;
  locale?: string;
}

interface AirportDto {
  id: number;
  title: string;
  city: { id: number; title: string };
}

interface StationDto {
  id: number;
  title: string;
}

interface CountryDto {
  id: number;
  title: string;
  image: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function isAirport(value: unknown): value is AirportDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    isRecord(value.city) &&
    isId(value.city.id) &&
    typeof value.city.title === "string"
  );
}

function isStation(value: unknown): value is StationDto {
  return isRecord(value) && isId(value.id) && typeof value.title === "string";
}

function isCountry(value: unknown): value is CountryDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    typeof value.image === "string" &&
    value.image.length > 0
  );
}

async function listOptions<T, M>(
  path: string,
  guard: (value: unknown) => value is T,
  map: (value: T) => M,
  { page, perPage, search, locale }: LookupRequest,
): Promise<Page<M>> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (search?.trim()) query.set("search", search.trim());
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `${path}?${query}`,
    locale ? { headers: { "Accept-Language": locale } } : undefined,
  );
  const pagination = (response as { pagination?: unknown }).pagination;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !Array.isArray(response.data) ||
    !response.data.every(guard) ||
    !isPaginationDto(pagination)
  ) {
    throw new AppError("server");
  }
  return toPage(response.data.map(map), pagination);
}

const listAirports = (request: LookupRequest) =>
  listOptions(
    "/airports",
    isAirport,
    ({ id, title, city }): Airport => ({
      id,
      airport: title,
      city: city.title,
    }),
    request,
  );

const listStations = (request: LookupRequest) =>
  listOptions(
    "/train-stations",
    isStation,
    ({ id, title }): Station => ({
      id,
      station: title,
    }),
    request,
  );

const listCountries = (request: LookupRequest) =>
  listOptions(
    "/countries",
    isCountry,
    ({ id, title, image }): Country => ({
      id,
      name: title,
      flag: image,
    }),
    request,
  );

async function getOptions(locale?: string): Promise<RentalSearchOptions> {
  const [airports, stations, countries] = await Promise.all([
    listAirports({ page: 1, perPage: 20, locale }),
    listStations({ page: 1, perPage: 20, locale }),
    listCountries({ page: 1, perPage: 20, locale }),
  ]);
  return { airports, stations, countries };
}

export const rentalSearchApi: RentalSearchApi = {
  listAirports,
  listStations,
  listCountries,
  getOptions,
};
