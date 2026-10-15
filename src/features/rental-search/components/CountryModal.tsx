'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiSearch } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';
import type { Country } from '../model';
import './CountryModal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onSelect: (country: Country) => void;
}

export default function CountryModal({ open, countries, onClose, onSelect }: Props) {
  const t = useTranslations('rentalSearch.country');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Country | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} className="country-dialog" initialFocusRef={searchRef}>
      <Dialog.Header className="country-dialog__header">
        <div>
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Description>{t('description')}</Dialog.Description>
        </div>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="country-dialog__body">
        <label className="country-dialog__search" htmlFor="country-search">
          <FiSearch aria-hidden="true" />
          <input
            ref={searchRef}
            id="country-search"
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="country-dialog__list">
          {filtered.map((country) => (
            <button
              key={country.id}
              type="button"
              className="country-dialog__item"
              data-selected={selected?.id === country.id || undefined}
              aria-pressed={selected?.id === country.id}
              onClick={() => setSelected(country)}
            >
              <span className="country-dialog__flag">
                <Image src={country.flag} alt="" width={36} height={24} />
              </span>
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      </Dialog.Body>

      <Dialog.Footer className="country-dialog__footer">
        <button
          type="button"
          className="country-dialog__confirm"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {t('confirm')}
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}
