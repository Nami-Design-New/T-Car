import type { CarListing, OfficeCarGroup } from './model';

export const PRICE_MIN = 100;
export const PRICE_MAX = 30000;

export type CarSort = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

export interface CarSearchParams {
  query: string;
  minPrice: number;
  maxPrice: number;
  sort: CarSort;
  /** Search context sent by the hero and preserved for the real API. */
  context: Record<string, string>;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), min), max) : fallback;
}

export function parseCarSearchParams(input: SearchParamsInput = {}): CarSearchParams {
  const minPrice = boundedNumber(first(input.priceMin), PRICE_MIN, PRICE_MIN, PRICE_MAX - 1);
  const maxPrice = boundedNumber(first(input.priceMax), PRICE_MAX, minPrice + 1, PRICE_MAX);
  const sort = first(input.sort);

  const context: Record<string, string> = {};
  for (const key of ['type', 'city', 'branch', 'lat', 'lng', 'from', 'to', 'airportId', 'stationId', 'countryId']) {
    const value = first(input[key]);
    if (value) context[key] = value;
  }

  return {
    query: first(input.q)?.trim() ?? '',
    minPrice,
    maxPrice,
    sort: sort === 'price_asc' || sort === 'price_desc' || sort === 'rating' ? sort : 'recommended',
    context,
  };
}

export function filterAndSortCars(cars: CarListing[], params: CarSearchParams): CarListing[] {
  const query = params.query.toLocaleLowerCase();
  const filtered = cars.filter((car) => {
    const searchable = `${car.name} ${car.brand} ${car.showroom}`.toLocaleLowerCase();
    return (
      car.pricePerDay >= params.minPrice &&
      car.pricePerDay <= params.maxPrice &&
      (!query || searchable.includes(query))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (params.sort) {
      case 'price_asc':
        return a.pricePerDay - b.pricePerDay;
      case 'price_desc':
        return b.pricePerDay - a.pricePerDay;
      case 'rating':
        return b.rating - a.rating;
      default:
        return b.rating - a.rating;
    }
  });
}

export function filterOfficeGroups(groups: OfficeCarGroup[], params: CarSearchParams): OfficeCarGroup[] {
  return groups
    .map((group) => ({ ...group, cars: filterAndSortCars(group.cars, params) }))
    .filter((group) => group.cars.length > 0);
}
