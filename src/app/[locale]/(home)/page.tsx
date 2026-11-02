import { Hero } from '@/features/rental-search';
import { getRentalSearchOptions } from '@/features/rental-search/queries';
import { CarsRail } from '@/features/cars';
import { getCarBrands, getHandpickedCars, getOfferCars, getOffices } from '@/features/cars/queries';
import { PopularCities } from '@/features/cities';
import { getCities } from '@/features/cities/queries';
import { CTA, Contact, DownloadApp, FAQ, Partners, WhyChooseUs } from '@/features/home';
import { getFaqs } from '@/features/home/queries';
import { getBookingTypeAvailability, getSiteSettings } from '@/features/settings/queries';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, searchOptions, brands, cities, offerCars, handpickedCars, faqs, offices, site, bookingTypes] = await Promise.all([
    getTranslations('carSections'),
    getRentalSearchOptions(),
    getCarBrands(),
    getCities(),
    getOfferCars(),
    getHandpickedCars(),
    getFaqs(),
    getOffices(),
    getSiteSettings(),
    getBookingTypeAvailability(),
  ]);

  return (
    <>
      <Hero
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
      <Partners offices={offices} />
      <WhyChooseUs />
      <FAQ faqs={faqs} />
      <DownloadApp />
      <Contact contact={site.contact} />
      <CTA/>
    </>
  );
}
