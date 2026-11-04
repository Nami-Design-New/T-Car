import { Hero } from "@/features/rental-search";
import { getRentalSearchOptions } from "@/features/rental-search/queries";
import { getCityCarFilterOptions } from "@/features/cars/queries";
import { PopularCities } from "@/features/cities";
import { getCities } from "@/features/cities/queries";
import {
  CTA,
  Contact,
  DownloadApp,
  FAQ,
  HomeOffersSection,
  HomeCarefullyChosenCarsSection,
  Partners,
  WhyChooseUs,
} from "@/features/home";
import {
  getFaqs,
  getHomeContent,
  getPartners,
  getSliders,
  getWhyUsCards,
} from "@/features/home/queries";
import {
  getBookingTypeAvailability,
  getSiteSettings,
} from "@/features/settings/queries";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const [
    t,
    homeContent,
    searchOptions,
    filterOptions,
    cities,
    faqs,
    partners,
    whyUsCards,
    sliders,
    site,
    bookingTypes,
  ] = await Promise.all([
    getTranslations("carSections"),
    getHomeContent(),
    getRentalSearchOptions(),
    getCityCarFilterOptions(),
    getCities(),
    getFaqs(),
    getPartners(),
    getWhyUsCards(),
    getSliders(),
    getSiteSettings(),
    getBookingTypeAvailability(),
  ]);

  return (
    <>
      <Hero
        content={homeContent.hero}
        options={searchOptions}
        filterOptions={filterOptions}
        bookingTypes={bookingTypes}
        priceRange={site.priceFilterRange}
        slides={sliders}
      />
      <PopularCities cities={cities} />
      <HomeOffersSection
        title={t("offers")}
        subtitle={t("offersSubtitle")}
        options={searchOptions}
      />
      <HomeCarefullyChosenCarsSection
        title={t("selectedForYou")}
        subtitle={t("selectedForYouSubtitle")}
        options={searchOptions}
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
