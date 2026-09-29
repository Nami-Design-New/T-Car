import 'server-only';
import { cache } from 'react';
import { citiesApi } from '@/services/cities.api';
import { toAppError } from '@/shared/lib/errors';
import type { City, CityDetails } from './model';

export function getCities(): Promise<City[]> {
  return citiesApi.listCities();
}

/**
 * Null for an unknown slug, so the page can call notFound(). Other failures
 * throw to error.tsx. Cached per request: generateMetadata and the page share one read.
 */
export const getCityDetails = cache(async (slug: string): Promise<CityDetails | null> => {
  try {
    return await citiesApi.getCityDetails(slug);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.kind === 'not_found') return null;
    throw appError;
  }
});
