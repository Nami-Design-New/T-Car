import { AppError } from "@/shared/lib/errors";
import { fail, ok } from "@/shared/lib/result";
import type { ContactApi, FaqsApi, PartnersApi } from "./api";
import type { FAQItem, HomePartner } from "./model";

/*
 * Test double of the live `ContactApi` (no production caller, no mock flag).
 * Stateless, so it is safe on the server.
 *
 * Failure rule, as the API answers it: an email without "@" is a 422 "The
 * email address must be a valid email address.".
 */
export const contactMock: ContactApi = {
  async sendMessage({ email }) {
    if (!email.includes("@")) {
      return fail(
        new AppError("validation", undefined, 422, undefined, {
          serverMessage: "The email address must be a valid email address.",
        }),
      );
    }
    return ok(null, "Contact request created successfully.");
  },
};

const FAQS: Record<"ar" | "en", FAQItem[]> = {
  en: [
    {
      id: "1",
      question: "What documents do I need to rent a car?",
      answer:
        "You need a valid driving licence, a national ID or residence permit, and a payment method in your name.",
    },
    {
      id: "2",
      question: "Can I cancel my booking?",
      answer: "You can cancel free of charge up to 24 hours before pickup.",
    },
  ],
  ar: [
    {
      id: "1",
      question: "ما المستندات المطلوبة لاستئجار سيارة؟",
      answer:
        "تحتاج إلى رخصة قيادة سارية وهوية وطنية أو إقامة ووسيلة دفع باسمك.",
    },
    {
      id: "2",
      question: "هل يمكنني إلغاء الحجز؟",
      answer: "يمكنك الإلغاء مجانًا قبل موعد الاستلام بـ 24 ساعة.",
    },
  ],
};

/**
 * Test double of the public FAQ read. Stateless and safe for server tests.
 * Failure rule: unsupported locale values throw a server AppError.
 */
export const faqsMock: FaqsApi = {
  async listFaqs(locale) {
    if (locale !== "ar" && locale !== "en") throw new AppError("server");
    return [...FAQS[locale]];
  },
};

const PARTNERS: Record<"ar" | "en", HomePartner[]> = {
  en: [
    {
      id: "1",
      name: "Partner 1",
      imageUrl: "https://t-car.app/storage/partners/partner-1.webp",
    },
    {
      id: "2",
      name: "Partner 2",
      imageUrl: "https://t-car.app/storage/partners/partner-2.webp",
    },
  ],
  ar: [
    {
      id: "1",
      name: "شريك 1",
      imageUrl: "https://t-car.app/storage/partners/partner-1.webp",
    },
    {
      id: "2",
      name: "شريك 2",
      imageUrl: "https://t-car.app/storage/partners/partner-2.webp",
    },
  ],
};

/**
 * Test double of the public partners read. Stateless and safe for server tests.
 * Failure rule: unsupported locale values throw a server AppError.
 */
export const partnersMock: PartnersApi = {
  async listPartners(locale) {
    if (locale !== "ar" && locale !== "en") throw new AppError("server");
    return [...PARTNERS[locale]];
  },
};
