import Hero from '@components/home/Hero';
import PopularCities from '@/components/home/Cities';
import CarsRail from '@/components/home/CarsRail';
import WhyChooseUs from '@/components/home/Why';
import Partners from '@/components/home/Partners';
import DownloadApp from '@/components/home/Download';
import FAQ from '@components/home/FAQ';
import Contact from '@/components/home/contact';
import CTA from '@/components/home/CTA/CTA';
import { getHandpickedCars, getOfferCars } from '@/services/mocks/cars';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('carSections');

  return (
    <>
      <Hero />
      <PopularCities />
      <CarsRail
        id="offers"
        title={t('offers')}
        subtitle={t('offersSubtitle')}
        cars={getOfferCars()}
      />
      <CarsRail
        id="selected-for-you"
        title={t('selectedForYou')}
        subtitle={t('selectedForYouSubtitle')}
        cars={getHandpickedCars()}
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
