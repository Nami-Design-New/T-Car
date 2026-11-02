"use client";

import type { ContactSettings } from "@/features/settings";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import type { HomeContactContent } from "../model";
import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";

interface Props {
  /** From GET /settings; a missing detail is hidden. */
  contact: ContactSettings;
  content: HomeContactContent;
}

export default function Contact({ contact, content }: Props) {
  return (
    <section className="pb-20 max-md:pb-12 lg:pb-24" id="contact">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle
          smallTitle={content.eyebrow}
          title={content.title}
          subtitle={content.description}
        />
        <div className="mt-6 grid grid-cols-[380px_1fr] gap-8.75 max-lg:mt-8.5 max-lg:grid-cols-1">
          <ContactInfo contact={contact} />
          <ContactForm
            title={content.formTitle}
            description={content.formDescription}
          />
        </div>
      </div>
    </section>
  );
}
