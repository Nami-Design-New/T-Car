export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  contactReason: string;
  bookingNumber?: string;
  message: string;
}
