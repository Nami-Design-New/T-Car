import { CarFilters, CarOfficeRow, SortBar, parseCarSearchParams } from '@/features/cars';
import { getOfficeCarGroups } from '@/features/cars/queries';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FiArrowLeft } from 'react-icons/fi';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CarsPage({ searchParams }: Props) {
  const t = await getTranslations();
  const params = parseCarSearchParams(await searchParams);
  const officeGroups = await getOfficeCarGroups(params);

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
            <SortBar
              resultsCount={officeGroups.reduce((count, group) => count + group.cars.length, 0)}
              value={params.sort}
            />
            {officeGroups.map(({ office, cars: officeCars }) => (
              <CarOfficeRow key={office.id} office={office} cars={officeCars} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
