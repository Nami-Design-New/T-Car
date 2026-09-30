import type { MetadataRoute } from 'next';
import { getCarsForCity } from '@/features/cars/queries';
import { getCities } from '@/features/cities/queries';
import { routing } from '@/i18n/routing';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type Entry = {
  /** Locale-less path, e.g. `/cars` ('' for the home page). */
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

/** Public pages only; /account needs a session and is left out. */
const STATIC_PAGES: Entry[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/cars', changeFrequency: 'daily', priority: 0.9 },
  { path: '/cities', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/why', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-us', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

const localized = (locale: string, path: string) => `${siteUrl}/${locale}${path}`;

/** One URL per locale, each pointing at its translations (hreflang). */
function expand({ path, changeFrequency, priority }: Entry): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, localized(locale, path)])
  );
  return routing.locales.map((locale) => ({
    url: localized(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The mock cars have no city yet, so any slug returns the full list.
  const [cities, cars] = await Promise.all([getCities(), getCarsForCity('')]);

  const entries: Entry[] = [
    ...STATIC_PAGES,
    ...cities.map((city): Entry => ({
      path: `/cities/${city.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...cars.map((car): Entry => ({
      path: `/cars/${car.id}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })),
  ];

  return entries.flatMap(expand);
}
