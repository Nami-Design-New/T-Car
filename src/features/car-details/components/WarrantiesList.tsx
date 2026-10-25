'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { Accordion } from '@/shared/ui/Accordion';
import { cn } from '@/shared/lib/cn';
import type { CarWarranty } from '../model';

interface Props {
  warranties: CarWarranty[];
}

export default function WarrantiesList({ warranties }: Props) {
  const t = useTranslations('carDetails');
  // All closed at first; '' is Radix's "none open" for a single accordion.
  const [openId, setOpenId] = useState('');

  return (
      <section className="details-section mt-8 border-t border-stroke-light pt-6">
      <h3 className="mb-[18px] text-[1.15rem] font-bold text-text-primary">{t('warranties')}</h3>

      <Accordion.Root
        type="single"
        collapsible
        value={openId}
        onValueChange={setOpenId}
        className="warranties-list flex flex-col gap-2.5"
      >
        {warranties.map((w) => (
            <Accordion.Item key={w.id} value={w.id} className="warranty-item overflow-hidden rounded-md border border-stroke-light">
            <Accordion.Trigger className="warranty-item-header flex w-full items-center gap-3 border-0 bg-surface-elevated px-4 py-3.5 text-start">
              <span className="warranty-icon grid size-[26px] shrink-0 place-items-center rounded-full bg-action-primary text-sm text-text-on-action" aria-hidden="true">
                <FiCheck />
              </span>
              <span className="warranty-title flex-1 text-start text-[0.92rem] font-semibold text-text-primary">{w.title}</span>
              <FiChevronDown
                aria-hidden="true"
                className={cn('warranty-chevron text-text-subtle transition duration-300', openId === w.id && 'rotate-180')}
              />
            </Accordion.Trigger>

            <Accordion.Content>
              <p className="warranty-description m-0 px-4 pb-4 ps-[52px] text-[0.85rem] leading-[1.7] text-text-subtle">{w.description}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
