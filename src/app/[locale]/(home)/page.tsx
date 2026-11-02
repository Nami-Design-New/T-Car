import { Hero } from '@/features/rental-search';
import { getRentalSearchOptions } from '@/features/rental-search/queries';
import { CarsRail } from '@/features/cars';
import { getCarBrands, getHandpickedCars, getOfferCars } from '@/features/cars/queries';
import { PopularCities } from '@/features/cities';
import { getCities } from '@/features/cities/queries';
import { CTA, Contact, DownloadApp, FAQ, Partners, WhyChooseUs } from '@/features/home';
import { getFaqs, getHomeContent, getPartners, getWhyUsCards } from '@/features/home/queries';
import { getBookingTypeAvailability, getSiteSettings } from '@/features/settings/queries';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, homeContent, searchOptions, brands, cities, offerCars, handpickedCars, faqs, partners, whyUsCards, site, bookingTypes] = await Promise.all([
    getTranslations('carSections'),
    getHomeContent(),
    getRentalSearchOptions(),
    getCarBrands(),
    getCities(),
    getOfferCars(),
    getHandpickedCars(),
    getFaqs(),
    getPartners(),
    getWhyUsCards(),
    getSiteSettings(),
    getBookingTypeAvailability(),
  ]);

  return (
    <>
      <Hero
        content={homeContent.hero}
        options={searchOptions}
        brands={brands}
        bookingTypes={bookingTypes}
        priceRange={site.priceFilterRange}
      />
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
      <Partners partners={partners} content={homeContent.partners} />
      <WhyChooseUs content={homeContent.whyUs} cards={whyUsCards} />
      <FAQ faqs={faqs} content={homeContent.support} />
      <DownloadApp content={homeContent.apps} />
      <Contact contact={site.contact} content={homeContent.contacts} />
      <CTA content={homeContent.joinUs} />
    </>
  );
}
