import CarFilters from '@components/cars/CarFilters';
import CarOfficeRow from '@components/cars/CarOfficeRow';
import type { CarListing } from '@app-types/car';
import { MOCK_CARS } from '@/data/cars';
import { groupCarsByOffice } from '@/data/offices';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FiArrowLeft } from 'react-icons/fi';

async function getCars(): Promise<CarListing[]> {
  return MOCK_CARS;
}

export default async function CarsPage() {
  const t = await getTranslations();
  const cars = await getCars();
  const officeGroups = groupCarsByOffice(cars);

  return (
    <section className="section city-listings car-page">
      <div className="container-tcar">
        <header className="car-page__heading">
          <Link href="/" className="car-page__back" aria-label={t('notFound.home')}>
            <FiArrowLeft className="mirror-in-rtl" aria-hidden="true" />
          </Link>
          <h1>{t('carsPage.title')}</h1>
        </header>

        <div className="city-listings-grid">
          <CarFilters />
          <div className="office-rows">
            {officeGroups.map(({ office, cars: officeCars }) => (
              <CarOfficeRow key={office.id} office={office} cars={officeCars} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
