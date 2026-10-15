import type { Metadata } from 'next';
import { WhyChooseUs } from '@/features/home';

export const metadata: Metadata = {
  title: 'Why Choose Us',
  description: 'Discover why T-Car is your trusted choice for car rentals.',
};

export default function WhyPage() {
  return <WhyChooseUs />;
}