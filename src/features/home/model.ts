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
