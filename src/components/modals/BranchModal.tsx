'use client';

import { useState } from 'react';
import { FiMapPin, FiSearch, FiX } from 'react-icons/fi';

import {
  Branch,
  BranchModalProps,
} from '@/types/car';

const branches: Branch[] = [
  {
    id: 1,
    city: 'الرياض',
    branch: 'فرع العليا',
    address: 'طريق الملك فهد',
  },
  {
    id: 2,
    city: 'جدة',
    branch: 'فرع الروضة',
    address: 'شارع الأمير سلطان',
  },
  {
    id: 3,
    city: 'الدمام',
    branch: 'فرع الفيصلية',
    address: 'شارع الخليج',
  },
  {
    id: 4,
    city: 'المدينة',
    branch: 'فرع العزيزية',
    address: 'طريق الملك عبدالله',
  },
];

export default function BranchModal({
  open,
  onClose,
  onSelect,
}: BranchModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Branch | null>(null);

  if (!open) return null;

  const filtered = branches.filter((item) =>
    `${item.city} ${item.branch}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="modal_overlay">

      <div className="branch_modal">

        <button
          className="close_btn"
          onClick={onClose}
        >
          <FiX />
        </button>

        <div className="modal_header">
          <h2>اختر الفرع</h2>

          <p>
            اختر أقرب فرع لاستلام السيارة.
          </p>
        </div>

        <div className="search_box">

          <FiSearch />

          <input
            type="text"
            placeholder="ابحث عن مدينة أو فرع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <div className="branch_list">

          {filtered.map((branch) => (

            <button
              key={branch.id}
              type="button"
              className={`branch_item ${
                selected?.id === branch.id
                  ? 'active'
                  : ''
              }`}
              onClick={() => setSelected(branch)}
            >
              <div className="icon">
                <FiMapPin />
              </div>

              <div className="content">

                <h4>
                  {branch.city} - {branch.branch}
                </h4>

                <p>{branch.address}</p>

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