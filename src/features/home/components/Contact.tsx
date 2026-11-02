"use client";

import { useTranslations } from "next-intl";

import type { ContactSettings } from "@/features/settings";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";

interface Props {
  /** From GET /settings; a missing detail is hidden. */
  contact: ContactSettings;
}

export default function Contact({ contact }: Props) {
  const t = useTranslations();

  return (
    <section className="pb-20 max-md:pb-12 lg:pb-24" id="contact">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle
          smallTitle={t("contact.smallTitle")}
          title={t("contact.title")}
          subtitle={t("contact.subtitle")}
        />
        <div className="mt-6 grid grid-cols-[380px_1fr] gap-8.75 max-lg:mt-8.5 max-lg:grid-cols-1">
          <ContactInfo contact={contact} />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
