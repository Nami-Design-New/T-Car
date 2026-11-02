import type { PhoneFieldValue } from "@/shared/lib/phone";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/** A partner logo in the home carousel (GET /partners). */
export interface HomePartner {
  id: string;
  name: string;
  imageUrl: string;
}

export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HomeSectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HomeContactContent extends HomeSectionContent {
  formTitle: string;
  formDescription: string;
}

export interface HomeJoinUsContent {
  title: string;
  description: string;
  image: string;
}

export interface HomeContent {
  hero: HomeHeroContent;
  partners: HomeSectionContent;
  support: HomeSectionContent;
  apps: HomeSectionContent;
  contacts: HomeContactContent;
  joinUs: HomeJoinUsContent;
  footer: { text: string };
}

export interface ContactMessage {
  name: string;
  email: string;
  /** Free text, sent as `reason`. */
  contactReason?: string;
  /** Sent as `order_number`. */
  bookingNumber?: string;
  message: string;
}

/** What the Join Us form sends (POST /join-us). */
export interface JoinUsRequest {
  name: string;
  phone: PhoneFieldValue;
  companyName: string;
  email: string;
  companySizeId: string;
}

