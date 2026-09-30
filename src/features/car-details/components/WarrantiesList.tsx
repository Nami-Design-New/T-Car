'use client';

import { useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { Accordion } from '@/shared/ui/Accordion';
import type { CarWarranty } from '../model';

interface Props {
  warranties: CarWarranty[];
}

export default function WarrantiesList({ warranties }: Props) {
  // All closed at first; '' is Radix's "none open" for a single accordion.
  const [openId, setOpenId] = useState('');

  return (
    <section className="details-section">
      <h3>ضمانات تي كار</h3>

      <Accordion.Root
        type="single"
        collapsible
        value={openId}
        onValueChange={setOpenId}
        className="warranties-list"
      >
        {warranties.map((w) => (
          <Accordion.Item key={w.id} value={w.id} className="warranty-item">
            <Accordion.Trigger className="warranty-item-header">
              <span className="warranty-icon" aria-hidden="true">
                <FiCheck />
              </span>
              <span className="warranty-title">{w.title}</span>
              <FiChevronDown
                aria-hidden="true"
                className={`warranty-chevron ${openId === w.id ? 'open' : ''}`}
              />
            </Accordion.Trigger>

            <Accordion.Content>
              <p className="warranty-description">{w.description}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
