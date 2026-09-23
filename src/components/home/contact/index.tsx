'use client';

import { useTranslations } from 'next-intl';;

import SectionTitle from '@/components/common/SectionTitle';
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

        <div className="contact_wrapper">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}