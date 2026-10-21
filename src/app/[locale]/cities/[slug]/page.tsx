import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CarOfficeRow,
  CarFilters,
  SortBar,
  parseCarSearchParams,
} from "@/features/cars";
import { getCarBrands, getOfficeCarGroupsForCity } from "@/features/cars/queries";
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

      <section className="section city-listings">
        <div className="container-tcar">
          {/* <SortBar resultsCount={officeGroups.reduce((count, group) => count + group.cars.length)} value={filters.sort} /> */}

          <div className="city-listings-grid">
            <CarFilters brands={brands} />

            <div className="office-rows">
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
