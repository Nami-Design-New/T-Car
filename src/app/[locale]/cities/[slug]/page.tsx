import CityHero from '@components/cities/CityHero';
import SortBar from '@components/cities/SortBar';
import CityFilters from '@components/cities/CityFilters';
import CityCarCard from '@components/cities/CityCarCard';
import type { CityDetails, CarListing } from '@app-types/car';
import { MOCK_CARS } from '@/data/cars';
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
                <CityCarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
