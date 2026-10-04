import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CarCard, CityFilters, SortBar, parseCarSearchParams } from '@/features/cars';
import { getCarBrands, getCarsForCity } from '@/features/cars/queries';
import { CityHero } from '@/features/cities';
import { getCityDetails } from '@/features/cities/queries';

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
  const [city, cars, brands] = await Promise.all([
    getCityDetails(slug),
    getCarsForCity(slug, filters),
    getCarBrands(),
  ]);
  if (!city) notFound();

  return (
    <>
      <CityHero city={city} />

      <section className="section city-listings">
        <div className="container-tcar">
          <SortBar resultsCount={cars.length} value={filters.sort} />

          <div className="city-listings-grid">
            <CityFilters brands={brands} />

            <div className="city-cars-grid">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
