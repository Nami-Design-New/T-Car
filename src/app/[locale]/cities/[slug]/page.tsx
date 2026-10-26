import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CarOfficeRow,
  CarFilters,
  SortBar,
  parseCarSearchParams,
} from "@/features/cars";
import {
  getCarBrands,
  getOfficeCarGroupsForCity,
} from "@/features/cars/queries";
import { CityHero } from "@/features/cities";
import { getCityDetails } from "@/features/cities/queries";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The city's own title; the query is cached, so the page reuses this read. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityDetails(slug);
  if (!city) notFound();

  return { title: city.name };
}

export default async function CityDetailsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = parseCarSearchParams(await searchParams);
  const [city, officeGroups, brands] = await Promise.all([
    getCityDetails(slug),
    getOfficeCarGroupsForCity(slug, filters),
    getCarBrands(),
  ]);
  if (!city) notFound();

  return (
    <>
      <CityHero city={city} />

      <section className="py-20 pt-0 max-md:py-12 max-md:pt-0">
        <div className="mx-auto w-full max-w-7xl px-2">
          {/* <SortBar resultsCount={officeGroups.reduce((count, group) => count + group.cars.length)} value={filters.sort} /> */}

          <div className="city-listings-grid grid grid-cols-[280px_1fr] items-start gap-8 max-lg:grid-cols-1">
            <CarFilters brands={brands} />

            <div className="office-rows flex min-w-0 flex-col gap-3">
              {officeGroups.map(({ office, cars }) => (
                <CarOfficeRow key={office.id} office={office} cars={cars} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
