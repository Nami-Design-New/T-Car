import 'server-only';
import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { citiesApi } from './api';
import type { City } from './model';

/**
 * Cached per request: the city page, its metadata, and the home rail share one
 * read. Outside a localized request (the sitemap), pass the locale.
 */
export const getCities = cache(async (locale?: string): Promise<City[]> =>
  citiesApi.listCities(locale ?? (await getLocale())),
);

/** Null for an unknown id, so the page can call notFound(). */
export async function getCity(id: string): Promise<City | null> {
  const cities = await getCities();
  return cities.find((city) => city.id === id) ?? null;
}
