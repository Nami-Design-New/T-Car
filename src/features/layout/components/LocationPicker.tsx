'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiChevronDown, FiMapPin } from 'react-icons/fi';
import type { LocationData } from '@/features/rental-search';

const MapLocationModal = dynamic(
  () => import('@/features/rental-search/components/MapLocationModal'),
  { ssr: false }
);

export default function LocationPicker() {
  const t = useTranslations('layout.location');
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleConfirm = (nextLocation: LocationData) => {
    setLocation(nextLocation);
    setOpen(false);
  };

  return (
    <div className="location-picker">
      <button
        type="button"
        className="location-picker-trigger"
        aria-label={t('choose')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <FiMapPin className="location-picker-icon" aria-hidden="true" />
        <span className="location-picker-address">
          {location?.address || t('default')}
        </span>
        <FiChevronDown className="location-picker-chevron" aria-hidden="true" />
      </button>

      {open && (
        <MapLocationModal
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
          initialLocation={location}
        />
      )}
    </div>
  );
}
