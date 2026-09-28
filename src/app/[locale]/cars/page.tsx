import { CarFilters, CarOfficeRow } from '@/features/cars';
import { getOfficeCarGroups } from '@/features/cars/queries';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FiArrowLeft } from 'react-icons/fi';

export default async function CarsPage() {
  const t = await getTranslations();
  const officeGroups = await getOfficeCarGroups();

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
