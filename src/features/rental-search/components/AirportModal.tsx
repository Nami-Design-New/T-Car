'use client';

import { useState } from 'react';

import {
  FiSearch,
  FiX,
} from 'react-icons/fi';

import { MdFlightTakeoff } from 'react-icons/md';

import type { Airport } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  airports: Airport[];
  onSelect: (airport: Airport) => void;
}


export default function AirportModal({
  open,
  airports,
  onClose,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');

  const [selected, setSelected] =
    useState<Airport | null>(null);

  if (!open) return null;

  const filtered = airports.filter((item) =>
    `${item.city} ${item.airport}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="modal_overlay">

<div className="selection_modal">
        <button
          className="close_btn"
          onClick={onClose}
        >
          <FiX />
        </button>

        <div className="modal_header">

          <h2>اختر المطار</h2>

          <p>
            اختر المطار الذي ترغب في استلام السيارة منه.
          </p>

        </div>

        <div className="search_box">

          <FiSearch />

          <input
            type="text"
            placeholder="ابحث عن مطار..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

<div className="selection_list">
          {filtered.map((airport) => (

            <button
              key={airport.id}
              type="button"
              className={`selection_item ${
                selected?.id === airport.id
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setSelected(airport)
              }
            >

              <div className="icon">
                <MdFlightTakeoff />
              </div>

              <div className="content">

                <h4>
                  {airport.airport}
                </h4>

                <p>{airport.city}</p>

              </div>

              <span className="code">
                {airport.code}
              </span>

            </button>

          ))}

        </div>

        <button
          className="confirm_btn"
          disabled={!selected}
          onClick={() =>
            selected &&
            onSelect(selected)
          }
        >
          متابعة
        </button>

      </div>

    </div>
  );
}