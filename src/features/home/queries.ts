import 'server-only';
import { getLocale } from 'next-intl/server';
import { faqsApi, homeApi } from './api';
import type { FAQItem, HomeHeroContent } from './model';

export async function getHomeHeroContent(): Promise<HomeHeroContent> {
  return homeApi.getHeroContent(await getLocale());
}

export async function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs(await getLocale());
}
