import type { Metadata } from 'next';
import SectionTitle from '@components/common/SectionTitle';
import PopularCities from '@components/home/Cities';

export const metadata: Metadata = {
  title: 'المدن',
  description: 'تصفح كل المدن المتاحة لتأجير السيارات مع تكلفي واختر مدينتك.',
};

export default function CitiesPage() {
  return (
    <section className="section">
      <div className="container-tcar">
        <SectionTitle title="المدن المتاحة" subtitle="اختر مدينتك وابدأ رحلتك معنا" />
        <PopularCities />
      </div>
    </section>
  );
}