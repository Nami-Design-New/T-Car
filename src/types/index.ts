export type { Car, SearchCarsParams } from './car';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  message: string;
  rating: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}
