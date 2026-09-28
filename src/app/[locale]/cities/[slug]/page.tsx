import CityHero from '@components/cities/CityHero';
import { CarCard, CityFilters, SortBar, type CarListing } from '@/features/cars';
import type { CityDetails } from '@app-types/car';
import { MOCK_CARS } from '@/services/mocks/cars';
import cityHeroImage from '@assets/images/c1.jpg';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCityDetails(slug: string): Promise<CityDetails> {
  return {
    id: '1',
    name: 'المدينة المنورة',
    slug,
    heroImage: cityHeroImage,
    carsCount: 24,
  };
}

async function getCarsForCity(slug: string): Promise<CarListing[]> {
  return MOCK_CARS;
}
export default async function CityDetailsPage({ params }: Props) {
  const { slug } = await params;
  const city = await getCityDetails(slug);
  const cars = await getCarsForCity(slug);

  return (
    <>
      <CityHero city={city} />

      <section className="section city-listings">
        <div className="container-tcar">
          <SortBar resultsCount={city.carsCount} />

          <div className="city-listings-grid">
            <CityFilters />

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
