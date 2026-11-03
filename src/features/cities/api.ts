import 'server-only';
import { isApiEnvelope, type ApiEnvelope } from '@/services/http/envelope';
import { publicServerHttp } from '@/services/http/server';
import { IMAGES } from '@/shared/config/assets';
import { AppError } from '@/shared/lib/errors';
import type { CarListing, CarOffer, OfficeCarGroup } from '@/features/cars';
import type { City } from './model';

export interface CitiesApi {
  listCities(locale: string): Promise<City[]>;
}

interface CityDto {
  id: number;
  city_name: string;
  city_image: string | null;
  region: string;
  cars_count: number;
}

/** TEST has 21 cities; one page holds them all (docs/api/cities-api.md §3.1). */
const CITIES_PER_PAGE = 100;

function isCity(value: unknown): value is CityDto {
  if (typeof value !== 'object' || value === null) return false;
  const city = value as Record<string, unknown>;
  return (
    typeof city.id === 'number' &&
    Number.isFinite(city.id) &&
    typeof city.city_name === 'string' &&
    (city.city_image === null || typeof city.city_image === 'string') &&
    typeof city.region === 'string' &&
    typeof city.cars_count === 'number' &&
    Number.isFinite(city.cars_count)
  );
}

/** GET /cities: public, localized names; `region` stays Arabic. */
async function listCities(locale: string): Promise<City[]> {
  const response = await publicServerHttp.get<ApiEnvelope<unknown>>(
    `/cities?per_page=${CITIES_PER_PAGE}`,
    { headers: { 'Accept-Language': locale } },
  );
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !Array.isArray(response.data) ||
    !response.data.every(isCity)
  ) {
    throw new AppError('server');
  }
  return response.data.map(({ id, city_name, city_image, region, cars_count }) => ({
    id: String(id),
    name: city_name,
    region,
    image: city_image || IMAGES.imageFallback.src,
    carsAvailable: cars_count,
  }));
}

export const citiesApi: CitiesApi = { listCities };

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

interface CityCarDto {
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
}

interface CityCompanyGroupDto {
  company_id: number;
  company_name: string;
  company_logo: string | null;
  cars: CityCarDto[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function isLookup(value: unknown): value is LookupDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.title === 'string' &&
    isNullableString(value.logo)
  );
}

function isOffer(value: unknown): value is OfferDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.type === 'string' &&
    isNumber(value.require_booking_days) &&
    isNumber(value.free_days)
  );
}

function isCityCar(value: unknown): value is CityCarDto {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNullableString(value.image_url) &&
    isNumber(value.year) &&
    typeof value.company_name === 'string' &&
    isNullableString(value.company_logo) &&
    typeof value.any_car_branches_support_airport === 'boolean' &&
    isNumber(value.lower_price) &&
    isNumber(value.rate) &&
    isLookup(value.brand) &&
    isLookup(value.car_model) &&
    (value.offer === null || isOffer(value.offer))
  );
}

/** A `/city-cars` group with valid cars (docs/api/cities-api.md §3.2). */
export function isCityCompanyGroup(value: unknown): value is CityCompanyGroupDto {
  return (
    isRecord(value) &&
    isNumber(value.company_id) &&
    typeof value.company_name === 'string' &&
    isNullableString(value.company_logo) &&
    Array.isArray(value.cars) &&
    value.cars.every(isCityCar)
  );
}

/** Only `free_days` is known (Q8); any other type maps to no offer. */
function toCarOffer(offer: OfferDto | null): CarOffer | undefined {
  if (offer?.type !== 'free_days' || offer.free_days < 1) return undefined;
  return { requiredDays: offer.require_booking_days, freeDays: offer.free_days };
}

export function mapCityCar(car: CityCarDto): CarListing {
  return {
    id: String(car.id),
    name: car.car_model.title,
    brand: car.brand.title,
    image: car.image_url || IMAGES.imageFallback.src,
    pricePerDay: car.lower_price,
    rating: car.rate,
    year: car.year,
    showroom: car.company_name,
    showroomLogo: car.company_logo || undefined,
    pickupPoint: car.any_car_branches_support_airport ? 'airport' : undefined,
    offer: toCarOffer(car.offer),
  };
}

export function mapCityCompanyGroup(group: CityCompanyGroupDto): OfficeCarGroup {
  return {
    office: {
      id: String(group.company_id),
      slug: String(group.company_id),
      name: group.company_name,
      showroom: group.company_name,
      logo: group.company_logo || IMAGES.imageFallback.src,
    },
    cars: group.cars.map(mapCityCar),
  };
}
