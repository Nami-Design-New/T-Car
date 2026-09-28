'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiSearch, FiX } from 'react-icons/fi';


import type { Country } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onSelect: (country: Country) => void;
}


export default function CountryModal({ open, countries, onClose, onSelect }: Props) {
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
