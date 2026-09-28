import type { Metadata } from 'next';
import SectionTitle from '@/shared/ui/SectionTitle';
import { PopularCities } from '@/features/cities';
import { getCities } from '@/features/cities/queries';

export const metadata: Metadata = {
  title: 'المدن',
  description: 'تصفح كل المدن المتاحة لتأجير السيارات مع تكلفي واختر مدينتك.',
};

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <section className="section">
      <div className="container-tcar">
        <SectionTitle title="المدن المتاحة" subtitle="اختر مدينتك وابدأ رحلتك معنا" />
        <PopularCities cities={cities} />
      </div>
    </section>
  );
}