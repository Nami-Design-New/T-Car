import type { City, CityDetails } from '@/features/cities/model';
import { citiesMock } from './mocks/cities';

export interface CitiesApi {
  listCities(): Promise<City[]>;
  /** Throws a `not_found` AppError for an unknown slug. */
  getCityDetails(slug: string): Promise<CityDetails>;
}

// The city endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const citiesApi: CitiesApi = citiesMock;
