import Hero from '@components/home/Hero';
import PopularCities from '@/components/home/Cities';
import WhyChooseUs from '@/components/home/Why';
import Partners from '@/components/home/Partners';
import DownloadApp from '@/components/home/Download';
import FAQ from '@components/home/FAQ';
import Contact from '@/components/home/contact';
import CTA from '@/components/home/CTA/CTA';
import { useTranslations } from 'next-intl';

export default function HomePage() {
    const t = useTranslations();

  return (
    <>
      <Hero />
      <PopularCities />
      <Partners />
      <WhyChooseUs />
      <FAQ />
      <DownloadApp />
      <Contact />
      <CTA/>
    </>
  );
}
