import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CarFilters,
  CityCarRows,
  parseCarSearchParams,
  toCityCarsQuery,
} from "@/features/cars";
import {
  getCarBrands,
} from "@/features/cars/queries";
import { CityHero } from "@/features/cities";
import { getCity } from "@/features/cities/queries";
import { getBookingTypeAvailability } from "@/features/settings/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { isBookingTypeEnabled } from "@/features/settings";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The city's own title; the query is cached, so the page reuses this read. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const city = await getCity(id);
  if (!city) notFound();

  return { title: city.name };
}

export default async function CityDetailsPage({ params, searchParams }: Props) {
  const [{ id }, rawSearchParams, bookingTypes, site] = await Promise.all([
    params,
    searchParams,
    getBookingTypeAvailability(),
    getSiteSettings(),
  ]);
  const priceRange = site.priceFilterRange;
  const filters = parseCarSearchParams(rawSearchParams, priceRange);
  if (!isBookingTypeEnabled(filters.context.type, bookingTypes)) notFound();
  const city = await getCity(id);
  if (!city) notFound();
  // The guest location is intentionally read in CityCarRows after hydration:
  // localStorage is unavailable here on the server.
  const query = toCityCarsQuery(filters);
  const brands = await getCarBrands();

  return (
    <>
      <CityHero city={city} />

      <section className="py-20 pt-0 max-md:py-12 max-md:pt-0">
        <div className="mx-auto w-full max-w-7xl px-2">
          <div className="city-listings-grid grid grid-cols-[280px_1fr] items-start gap-8 max-lg:grid-cols-1">
            <CarFilters brands={brands} priceRange={priceRange} />

            <div className="office-rows flex min-w-0 flex-col gap-3">
              <CityCarRows
                key={JSON.stringify(query)}
                query={query}
                cityName={city.name}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
