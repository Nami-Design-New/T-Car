'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiFileText, FiUserPlus } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import type { AddonService } from '../model';
import { cn } from '@/shared/lib/cn';

const ICONS = { external: FiFileText, driver: FiUserPlus };

interface Props {
  addons: AddonService[];
  onChange?: (selectedIds: string[]) => void;
}

export default function AddonsGrid({ addons, onChange }: Props) {
  const t = useTranslations('carDetails');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    setSelected(next);
    onChange?.(next);
  };

  return (
    <section className="details-section mt-8 border-t border-stroke-light pt-6">
      <h3 className="mb-[18px] text-[1.15rem] font-bold text-text-primary">{t('addons')}</h3>

      <div className="addons-grid grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
        {addons.map((addon) => {
          const Icon = ICONS[addon.icon];
          const isSelected = selected.includes(addon.id);

          return (
            <button
              key={addon.id}
              type="button"
              className={cn(
                'addon-card flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-stroke-light bg-surface-elevated px-3 py-5 transition duration-200 hover:border-action-primary',
                isSelected && 'selected border-action-primary bg-surface-card-primary',
              )}
              onClick={() => toggle(addon.id)}
            >
              <Icon className="addon-card-icon text-[22px] text-action-primary" />
              <span className="addon-card-title text-[0.85rem] font-semibold text-text-primary">{addon.title}</span>
              <span className="addon-card-price text-[0.8rem] font-bold text-action-primary">{formatCurrency(addon.price)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
