import type { Metadata } from 'next';
import SectionTitle from '@components/common/SectionTitle';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the T-Car team.',
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container-tcar">
        <SectionTitle title="Contact Us" subtitle="We'd love to hear from you" />
        <p>info@tcar.com</p>
        <p>+1 (555) 123-4567</p>
      </div>
    </section>
  );
}
