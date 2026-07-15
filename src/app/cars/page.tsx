import CarFilters from '@components/cars/CarFilters';
import CityCarCard from '@components/cities/CityCarCard';
import type { CarListing } from '@app-types/car';
import carImage from '@assets/images/car1.jpg';

async function getCars(): Promise<CarListing[]> {
  return [
    {
      id: '1',
      name: 'كريتا',
      brand: 'هيونداي',
      image: carImage,
      pricePerDay: 148.75,
      originalPrice: 200,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      rating: 4.6,
      reviewsCount: 32,
      year: 2024,
      showroom: 'معرض النخبة',
    },
    {
      id: '2',
      name: 'أورلاندر',
      brand: 'ميتسوبيشي',
      image: carImage,
      pricePerDay: 170,
      originalPrice: 250,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      rating: 4.4,
      reviewsCount: 18,
      year: 2023,
      showroom: 'معرض المتحدة',
    },
    {
      id: '3',
      name: 'كامري',
      brand: 'تويوتا',
      image: carImage,
      pricePerDay: 195,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      rating: 4.8,
      reviewsCount: 54,
      year: 2025,
      showroom: 'معرض الخليج',
    },
    {
      id: '4',
      name: 'سوناتا',
      brand: 'هيونداي',
      image: carImage,
      pricePerDay: 165,
      originalPrice: 220,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      rating: 4.7,
      reviewsCount: 29,
      year: 2024,
      showroom: 'معرض الرواد',
    },
    {
      id: '5',
      name: 'ألتيما',
      brand: 'نيسان',
      image: carImage,
      pricePerDay: 155,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      rating: 4.5,
      reviewsCount: 40,
      year: 2023,
      showroom: 'معرض الصفوة',
    },
    {
      id: '6',
      name: 'سيراتو',
      brand: 'كيا',
      image: carImage,
      pricePerDay: 135,
      originalPrice: 180,
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      rating: 4.3,
      reviewsCount: 21,
      year: 2024,
      showroom: 'معرض الشرق',
    },
  ];
}

export default async function CarsPage() {
  const cars = await getCars();

  return (
    <section className="section city-listings car-page">
      <div className="container-tcar">
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
