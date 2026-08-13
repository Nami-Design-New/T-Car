'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiSearch, FiX } from 'react-icons/fi';

import flag1 from '@/assets/images/flages/flag1.png';
import flag2 from '@/assets/images/flages/flag2.png';
import flag3 from '@/assets/images/flages/flag3.png';
import flag4 from '@/assets/images/flages/flag4.png';
import flag5 from '@/assets/images/flages/flag5.png';

import { Country, CountryModalProps } from '@/types/car';

const countries: Country[] = [
  { id: 1, name: 'مصر', flag: flag1 },
  { id: 2, name: 'لبنان', flag: flag2 },
  { id: 3, name: 'المملكة العربية السعودية', flag: flag3 },
  { id: 4, name: 'الامارات', flag: flag4 },
  { id: 5, name: ' البحرين', flag: flag5 },
];

export default function CountryModal({ open, onClose, onSelect }: CountryModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Country | null>(null);

  if (!open) return null;

  const filtered = countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal_overlay">
      <div className="selection_modal">
        <button className="close_btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="modal_header">
          <h2>اختر الدولة</h2>

          <p>اختر الدولة التي ترغب باستلام السيارة فيها.</p>
        </div>

        <div className="search_box">
          <FiSearch />

          <input
            type="text"
            placeholder="ابحث عن دولة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="selection_list">
          {filtered.map((country) => (
            <button
              key={country.id}
              type="button"
              className={`selection_item ${selected?.id === country.id ? 'active' : ''}`}
              onClick={() => setSelected(country)}
            >
              <div className="flag">
                <Image src={country.flag} alt={country.name} width={36} height={24} />
              </div>

              <div className="content">
                <h4>{country.name}</h4>

              </div>
            </button>
          ))}
        </div>

        <button
          className="confirm_btn mt-3"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          متابعة
        </button>
      </div>
    </div>
  );
}
