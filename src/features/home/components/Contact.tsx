"use client";

import { useTranslations } from "next-intl";

import { SectionTitle } from "@/shared/ui/SectionTitle";
import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";

export default function Contact() {
  const t = useTranslations();

  return (
    <section className="pb-20 max-md:pb-12" id="contact">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle
          smallTitle={t("contact.smallTitle")}
          title={t("contact.title")}
          subtitle={t("contact.subtitle")}
        />
        <div className="grid grid-cols-[380px_1fr] gap-8.75 max-lg:mt-8.5 max-lg:grid-cols-1">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
