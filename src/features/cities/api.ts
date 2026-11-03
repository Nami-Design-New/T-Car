import 'server-only';
import { isApiEnvelope, type ApiEnvelope } from '@/services/http/envelope';
import { publicServerHttp } from '@/services/http/server';
import { IMAGES } from '@/shared/config/assets';
import { AppError } from '@/shared/lib/errors';
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
