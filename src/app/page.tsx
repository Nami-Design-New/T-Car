import Hero from '@components/home/Hero';
import PopularCities from '@/components/home/Cities';
import WhyChooseUs from '@/components/home/Why';
import Partners from '@/components/home/Partners';
import DownloadApp from '@/components/home/Download';
import FAQ from '@components/home/FAQ';
import Contact from '@/components/home/contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularCities />
      <WhyChooseUs />
      <Partners />
      <FAQ />
      <DownloadApp />
            <Contact />

    </>
  );
}
