import 'server-only';
import { faqsApi } from '@/services/faqs.api';
import type { FAQItem } from './model';

export function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs();
}
