'use client';

import { useTranslations } from 'next-intl';;

import { SectionTitle } from '@/shared/ui/SectionTitle';
import ContactInfo from './ContactInfo';
import ContactForm from './ContactForm';

export default function Contact() {
  const t = useTranslations();


  return (
    <section className="contact section" id="contact">
      <div className="container-tcar">
        <SectionTitle
          smallTitle={t('contact.smallTitle')}
          title={t('contact.title')}
          subtitle={t('contact.subtitle')}
        />

        <div className="contact_wrapper grid grid-cols-[380px_1fr] gap-[35px] max-lg:grid-cols-1">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
