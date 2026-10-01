'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { FiSearch } from 'react-icons/fi';

import { MdFlightTakeoff } from 'react-icons/md';
import { Dialog } from '@/shared/ui/Dialog';

import type { Airport } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  airports: Airport[];
  onSelect: (airport: Airport) => void;
}

export default function AirportModal({ open, airports, onClose, onSelect }: Props) {
  const t = useTranslations('rentalSearch.airport');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Airport | null>(null);

  const filtered = airports.filter((item) =>
    `${item.city} ${item.airport}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="selection_modal">
      <Dialog.Close className="close_btn" />

      <div className="modal_header">
        <Dialog.Title>{t('title')}</Dialog.Title>

        <Dialog.Description>{t('description')}</Dialog.Description>
      </div>

      <div className="search_box">
        <FiSearch />

        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="selection_list">
        {filtered.map((airport) => (
          <button
            key={airport.id}
            type="button"
            className={`selection_item ${selected?.id === airport.id ? 'active' : ''}`}
            onClick={() => setSelected(airport)}
          >
            <div className="icon">
              <MdFlightTakeoff />
            </div>

            <div className="content">
              <h4>{airport.airport}</h4>

              <p>{airport.city}</p>
            </div>

            <span className="code">{airport.code}</span>
          </button>
        ))}
      </div>

      <button
        className="confirm_btn"
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
      >
        {t('confirm')}
      </button>
    </Dialog>
  );
}
