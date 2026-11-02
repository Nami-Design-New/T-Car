import type { PhoneFieldValue } from "@/shared/lib/phone";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
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

