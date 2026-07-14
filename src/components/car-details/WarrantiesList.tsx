'use client';

import { useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import type { CarWarranty } from '@app-types/car';

interface Props {
  warranties: CarWarranty[];
}

export default function WarrantiesList({ warranties }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="details-section">
      <h3>ضمانات تي كار</h3>

      <div className="warranties-list">
        {warranties.map((w) => (
          <div key={w.id} className="warranty-item">
            <button
              type="button"
              className="warranty-item-header"
              onClick={() => setOpenId(openId === w.id ? null : w.id)}
            >
              <span className="warranty-icon"><FiCheck /></span>
              <span className="warranty-title">{w.title}</span>
              <FiChevronDown className={`warranty-chevron ${openId === w.id ? 'open' : ''}`} />
            </button>

            {openId === w.id && (
              <p className="warranty-description">{w.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}