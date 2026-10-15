import type { FAQItem } from '@/features/home/model';
import { faqsMock } from './mocks/faqs';

export interface FaqsApi {
  listFaqs(): Promise<FAQItem[]>;
}

// No FAQ endpoint (or CMS) yet, so the mock is the only implementation.
export const faqsApi: FaqsApi = faqsMock;
