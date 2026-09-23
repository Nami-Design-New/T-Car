import CarFilters from '@components/cars/CarFilters';
import CityCarCard from '@components/cities/CityCarCard';
import type { CarListing } from '@app-types/car';
import { MOCK_CARS } from '@/data/cars';

async function getCars(): Promise<CarListing[]> {
  return MOCK_CARS;
}

export default async function CarsPage() {
  const cars = await getCars();

  return (
    <section className="section city-listings car-page">
      <div className="container-tcar">
        <h3 className="section-title">السيارات المتاحة</h3>
        <div className="city-listings-grid">
          <CarFilters />
          <div className="city-cars-grid">
            {cars.map((car) => (
              <CityCarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
