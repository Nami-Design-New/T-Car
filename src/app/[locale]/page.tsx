import Hero from '@components/home/Hero';
import PopularCities from '@/components/home/Cities';
import { CarsRail, getHandpickedCars, getOfferCars } from '@/features/cars';
import WhyChooseUs from '@/components/home/Why';
import Partners from '@/components/home/Partners';
import DownloadApp from '@/components/home/Download';
import FAQ from '@components/home/FAQ';
import Contact from '@/components/home/contact';
import CTA from '@/components/home/CTA/CTA';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const [t, offerCars, handpickedCars] = await Promise.all([
    getTranslations('carSections'),
    getOfferCars(),
    getHandpickedCars(),
  ]);

  return (
    <>
      <Hero />
      <PopularCities />
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
