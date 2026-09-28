import { Hero } from '@/features/rental-search';
import { CarsRail, getHandpickedCars, getOfferCars } from '@/features/cars';
import { PopularCities, getCities } from '@/features/cities';
import { CTA, Contact, DownloadApp, FAQ, Partners, WhyChooseUs } from '@/features/home';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, cities, offerCars, handpickedCars] = await Promise.all([
    getTranslations('carSections'),
    getCities(),
    getOfferCars(),
    getHandpickedCars(),
  ]);

  return (
    <>
      <Hero />
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
      <FAQ />
      <DownloadApp />
      <Contact />
      <CTA/>
    </>
  );
}
