import 'server-only';
import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { faqsApi, homeApi, partnersApi } from './api';
import type { FAQItem, HomeContent, HomePartner } from './model';

export const getHomeContent = cache(async (): Promise<HomeContent> =>
  homeApi.getContent(await getLocale()),
);

export async function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs(await getLocale());
}

export async function getPartners(): Promise<HomePartner[]> {
  return partnersApi.listPartners(await getLocale());
}
