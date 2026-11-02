import 'server-only';
import { getLocale } from 'next-intl/server';
import { faqsApi } from './api';
import type { FAQItem } from './model';

export async function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs(await getLocale());
}
