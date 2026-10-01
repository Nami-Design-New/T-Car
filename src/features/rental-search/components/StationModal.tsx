'use client';

import { useState } from 'react';

import { FiSearch } from 'react-icons/fi';

import { MdTrain } from 'react-icons/md';
import { Dialog } from '@/shared/ui/Dialog';

import type { Station } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  stations: Station[];
  onSelect: (station: Station) => void;
}

export default function StationModal({ open, stations, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Station | null>(null);

  const filtered = stations.filter((item) =>
    `${item.city} ${item.station}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="selection_modal">
      <Dialog.Close className="close_btn" />

      <div className="modal_header">
        <Dialog.Title>اختر محطة القطار</Dialog.Title>

        <Dialog.Description>اختر محطة القطار التي ترغب في استلام السيارة منها.</Dialog.Description>
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
    </Dialog>
  );
}
