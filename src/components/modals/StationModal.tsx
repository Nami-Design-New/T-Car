'use client';

import { useState } from 'react';

import { FiSearch, FiX } from 'react-icons/fi';

import { MdTrain } from 'react-icons/md';

import { Station, StationModalProps } from '@/types/car';

const stations: Station[] = [
  {
    id: 1,
    city: 'الرياض',
    station: 'محطة قطار الرياض',
  },
  {
    id: 2,
    city: 'جدة',
    station: 'محطة قطار جدة',
  },
  {
    id: 3,
    city: 'المدينة',
    station: 'محطة قطار المدينة',
  },
  {
    id: 4,
    city: 'مكة',
    station: 'محطة قطار مكة',
  },
  {
    id: 5,
    city: 'الدمام',
    station: 'محطة قطار الدمام',
  },
];

export default function StationModal({ open, onClose, onSelect }: StationModalProps) {
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Station | null>(null);

  if (!open) return null;

  const filtered = stations.filter((item) =>
    `${item.city} ${item.station}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal_overlay">
      <div className="selection_modal">
        <button className="close_btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="modal_header">
          <h2>اختر محطة القطار</h2>

          <p>اختر محطة القطار التي ترغب في استلام السيارة منها.</p>
        </div>

        <div className="search_box">
          <FiSearch />

          <input
            type="text"
            placeholder="ابحث عن محطة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="selection_list">
          {filtered.map((station) => (
            <button
              key={station.id}
              type="button"
              className={`selection_item ${selected?.id === station.id ? 'active' : ''}`}
              onClick={() => setSelected(station)}
            >
              <div className="icon">
                <MdTrain />
              </div>

              <div className="content">
                <h4>{station.station}</h4>

                <p>{station.city}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          className="confirm_btn"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          متابعة
        </button>
      </div>
    </div>
  );
}
