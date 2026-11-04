import 'server-only';
import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { faqsApi, homeApi, partnersApi, slidersApi, whyUsApi } from './api';
import type { FAQItem, HomeContent, HomePartner, HomeSlider, HomeWhyUsCard } from './model';

export const getHomeContent = cache(async (): Promise<HomeContent> =>
  homeApi.getContent(await getLocale()),
);

export async function getFaqs(): Promise<FAQItem[]> {
  return faqsApi.listFaqs(await getLocale());
}

export async function getPartners(): Promise<HomePartner[]> {
  return partnersApi.listPartners(await getLocale());
}

export async function getWhyUsCards(): Promise<HomeWhyUsCard[]> {
  return whyUsApi.listCards(await getLocale());
}

export async function getSliders(): Promise<HomeSlider[]> {
  return slidersApi.listSliders();
}
