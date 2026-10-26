import type { Metadata } from "next";
import { SectionTitle } from "@/shared/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the T-Car team.",
};

export default function ContactPage() {
  return (
    <section className="py-20 max-md:py-12">
      <div className="mx-auto w-full max-w-7xl px-2">
        <SectionTitle
          title="Contact Us"
          subtitle="We'd love to hear from you"
        />
        <p>info@tcar.com</p>
        <p>+1 (555) 123-4567</p>
      </div>
    </section>
  );
}
