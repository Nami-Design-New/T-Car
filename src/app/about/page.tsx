import type { Metadata } from 'next';
import SectionTitle from '@components/common/SectionTitle';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about T-Car, a modern car rental platform.',
};

export default function AboutPage() {
  return (
    <section className="section">
      <div className="container-tcar">
        <SectionTitle title="About T-Car" subtitle="Modern car rental, made simple" />
        <p>
          T-Car is a modern car rental platform that allows users to browse and rent the latest
          car models for business trips, family vacations, and personal transportation.
        </p>
      </div>
    </section>
  );
}
