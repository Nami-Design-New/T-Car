'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/shared/lib/format';
import { Tabs } from '@/shared/ui/Tabs';
import { cn } from '@/shared/lib/cn';
import type { InsuranceOption } from '../model';

interface Props {
  option: InsuranceOption;
}

type InsuranceTab = 'terms' | 'cancellation';

export default function InsuranceOptions({ option }: Props) {
  const t = useTranslations('carDetails.insurance');
  const [activeTab, setActiveTab] = useState<InsuranceTab>('terms');

  return (
    <section className="details-section mt-8 border-t border-stroke-light pt-6">
      <h3 className="mb-[18px] text-[1.15rem] font-bold text-text-primary">{t('title')}</h3>

      <div className="insurance-list mb-5 flex flex-col gap-2.5">
        <div className="insurance-item flex items-center gap-3 rounded-md border border-stroke-light bg-surface-card-primary px-4 py-3.5">
          <div className="insurance-item-body flex flex-1 flex-col gap-0.5">
            <span className="insurance-item-title text-[0.92rem] font-bold text-text-primary">{option.title}</span>
            <span className="insurance-item-subtitle text-[0.8rem] text-text-subtle">{option.subtitle}</span>
          </div>
        </div>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as InsuranceTab)}
      >
        <Tabs.List className="insurance-tabs mb-4 flex gap-2" aria-label={t('details')}>
          <Tabs.Trigger value="terms" className={cn("rounded-full border border-stroke-light bg-surface-elevated px-4 py-2 text-[0.85rem] font-semibold text-text-subtle transition hover:border-action-primary hover:text-action-primary data-[state=active]:border-action-primary data-[state=active]:bg-action-primary data-[state=active]:text-text-on-action", activeTab === 'terms' && 'active')}>
            {t('terms')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="cancellation"
            className={cn("rounded-full border border-stroke-light bg-surface-elevated px-4 py-2 text-[0.85rem] font-semibold text-text-subtle transition hover:border-action-primary hover:text-action-primary data-[state=active]:border-action-primary data-[state=active]:bg-action-primary data-[state=active]:text-text-on-action", activeTab === 'cancellation' && 'active')}
          >
            {t('cancellation')}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="terms">
          <ul className="insurance-terms-list m-0 flex list-none flex-col gap-2.5 p-0">
            {option.terms.map((term, i) => (
              <li key={i} className="relative ps-[18px] text-[0.85rem] leading-[1.8] text-text-subtle before:absolute before:start-0 before:top-[9px] before:size-1.5 before:rounded-full before:bg-action-primary">{term}</li>
            ))}
          </ul>
        </Tabs.Content>
        <Tabs.Content value="cancellation">
          <ul className="insurance-terms-list m-0 flex list-none flex-col gap-2.5 p-0">
            {option.cancellationPolicy.map((term, i) => (
              <li key={i} className="relative ps-[18px] text-[0.85rem] leading-[1.8] text-text-subtle before:absolute before:start-0 before:top-[9px] before:size-1.5 before:rounded-full before:bg-action-primary">{term}</li>
            ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
