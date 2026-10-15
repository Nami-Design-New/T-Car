import type { CarListing, OfficeCarGroup } from './model';

export const PRICE_MIN = 100;
export const PRICE_MAX = 30000;

export type CarSort = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

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
  minPrice: number;
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

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), min), max) : fallback;
}

function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? value.split(',') : [];
  return [
    ...new Set(
      values
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

export const DEFAULT_CAR_FILTERS: CarFilterDraft = {
  query: '',
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  brandIds: [],
  types: [],
  companyIds: [],
  serviceIds: [],
};

export function parseCarFilterDraft(input: SearchParamsInput = {}): CarFilterDraft {
  const minPrice = boundedNumber(first(input.priceMin), PRICE_MIN, PRICE_MIN, PRICE_MAX - 1);

  return {
    query: first(input.q)?.trim() ?? '',
    minPrice,
    maxPrice: boundedNumber(first(input.priceMax), PRICE_MAX, minPrice + 1, PRICE_MAX),
    brandIds: list(input.brands),
    types: list(input.types),
    companyIds: list(input.companies),
    serviceIds: list(input.services),
  };
}

export function applyCarFilterDraft(params: URLSearchParams, filters: CarFilterDraft) {
  const keys = ['q', 'priceMin', 'priceMax', 'brands', 'types', 'companies', 'services'];
  keys.forEach((key) => params.delete(key));
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.minPrice !== PRICE_MIN) params.set('priceMin', String(filters.minPrice));
  if (filters.maxPrice !== PRICE_MAX) params.set('priceMax', String(filters.maxPrice));
  if (filters.brandIds.length) params.set('brands', filters.brandIds.join(','));
  if (filters.types.length) params.set('types', filters.types.join(','));
  if (filters.companyIds.length) params.set('companies', filters.companyIds.join(','));
  if (filters.serviceIds.length) params.set('services', filters.serviceIds.join(','));
  return params;
}

export function parseCarSearchParams(input: SearchParamsInput = {}): CarSearchParams {
  const filters = parseCarFilterDraft(input);
  const sort = first(input.sort);

  const context: Record<string, string> = {};
  for (const key of [
    'type',
    'city',
    'branch',
    'lat',
    'lng',
    'from',
    'to',
    'airportId',
    'stationId',
    'countryId',
  ]) {
    const value = first(input[key]);
    if (value) context[key] = value;
  }

  return {
    ...filters,
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

export function filterOfficeGroups(
  groups: OfficeCarGroup[],
  params: CarSearchParams
): OfficeCarGroup[] {
  return groups
    .map((group) => ({ ...group, cars: filterAndSortCars(group.cars, params) }))
    .filter((group) => group.cars.length > 0);
}
