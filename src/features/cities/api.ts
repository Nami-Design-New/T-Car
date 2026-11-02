import 'server-only';
import type { City, CityDetails } from './model';
import { citiesMock } from './api.mock';

export interface CitiesApi {
  listCities(): Promise<City[]>;
  /** Throws a `not_found` AppError for an unknown slug. */
  getCityDetails(slug: string): Promise<CityDetails>;
}

// Still on the mock: the live `/cities`, `/city-cars`, and `/city-company-cars`
// reads replace it in the next fractions (docs/api/cities-api.md, C2-C5).
export const citiesApi: CitiesApi = citiesMock;
