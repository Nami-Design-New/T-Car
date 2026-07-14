'use client';

import { useState } from 'react';
import { FiFileText, FiUserPlus } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { AddonService } from '@app-types/car';

const ICONS = { external: FiFileText, driver: FiUserPlus };

interface Props {
  addons: AddonService[];
  onChange?: (selectedIds: string[]) => void;
}

export default function AddonsGrid({ addons, onChange }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    setSelected(next);
    onChange?.(next);
  };

  return (
    <section className="details-section">
      <h3>خدمات إضافية</h3>

      <div className="addons-grid">
        {addons.map((addon) => {
          const Icon = ICONS[addon.icon];
          const isSelected = selected.includes(addon.id);

          return (
            <button
              key={addon.id}
              type="button"
              className={`addon-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(addon.id)}
            >
              <Icon className="addon-card-icon" />
              <span className="addon-card-title">{addon.title}</span>
              <span className="addon-card-price">{formatCurrency(addon.price)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}