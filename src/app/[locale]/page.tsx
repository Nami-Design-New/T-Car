import { Hero } from '@/features/rental-search';
import { getRentalSearchOptions } from '@/features/rental-search/queries';
import { CarsRail } from '@/features/cars';
import { getHandpickedCars, getOfferCars } from '@/features/cars/queries';
import { PopularCities } from '@/features/cities';
import { getCities } from '@/features/cities/queries';
import { CTA, Contact, DownloadApp, FAQ, Partners, WhyChooseUs } from '@/features/home';
import { getFaqs } from '@/features/home/queries';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, searchOptions, cities, offerCars, handpickedCars, faqs] = await Promise.all([
    getTranslations('carSections'),
    getRentalSearchOptions(),
    getCities(),
    getOfferCars(),
    getHandpickedCars(),
    getFaqs(),
  ]);

  return (
    <>
      <Hero options={searchOptions} />
      <PopularCities cities={cities} />
      <CarsRail
        id="offers"
        title={t('offers')}
        subtitle={t('offersSubtitle')}
        cars={offerCars}
      />
      <CarsRail
        id="selected-for-you"
        title={t('selectedForYou')}
        subtitle={t('selectedForYouSubtitle')}
        cars={handpickedCars}
      />
      <Partners />
      <WhyChooseUs />
      <FAQ faqs={faqs} />
      <DownloadApp />
      <Contact />
      <CTA/>
    </>
  );
}
