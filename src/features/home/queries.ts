import 'server-only';
import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { faqsApi, homeApi } from './api';
import type { FAQItem, HomeContent } from './model';

export const getHomeContent = cache(async (): Promise<HomeContent> =>
  homeApi.getContent(await getLocale()),
);

export async function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs(await getLocale());
}
