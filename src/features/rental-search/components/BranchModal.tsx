'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiMapPin, FiSearch } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';

import type { Branch } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  onSelect: (branch: Branch) => void;
}

export default function BranchModal({ open, branches, onClose, onSelect }: Props) {
  const t = useTranslations('rentalSearch.branch');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Branch | null>(null);

  const filtered = branches.filter((item) =>
    `${item.city} ${item.branch}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="branch_modal">
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

      <div className="branch_list">
        {filtered.map((branch) => (
          <button
            key={branch.id}
            type="button"
            className={`branch_item ${selected?.id === branch.id ? 'active' : ''}`}
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
        {t('confirm')}
      </button>
    </Dialog>
  );
}
