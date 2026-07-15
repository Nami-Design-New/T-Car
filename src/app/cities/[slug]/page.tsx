import CityHero from '@components/cities/CityHero';
import SortBar from '@components/cities/SortBar';
import CityFilters from '@components/cities/CityFilters';
import CityCarCard from '@components/cities/CityCarCard';
import type { CityDetails, CarListing } from '@app-types/car';
import carImage from '@assets/images/car1.jpg';
import cityHeroImage from '@assets/images/c1.jpg';

interface Props {
  params: { slug: string };
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
      // بدون خصم
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
export default async function CityDetailsPage({ params }: Props) {
  const city = await getCityDetails(params.slug);
  const cars = await getCarsForCity(params.slug);

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
