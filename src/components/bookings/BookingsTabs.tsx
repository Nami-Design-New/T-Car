'use client';

import type { BookingTab } from '@app-types/car';

interface Props {
  active: BookingTab;
  onChange: (tab: BookingTab) => void;
  activeCount: number;
  pastCount: number;
}

export default function BookingsTabs({ active, onChange, activeCount, pastCount }: Props) {
  return (
    <div className="bookings-tabs">
     
      <button
        type="button"
        className={active === 'active' ? 'active' : ''}
        onClick={() => onChange('active')}
      >
        حالية
        <span className="count">{activeCount}</span>
      </button>

       <button
        type="button"
        className={active === 'past' ? 'active' : ''}
        onClick={() => onChange('past')}
      >
        سابقة
        <span className="count">{pastCount}</span>
      </button>
    </div>
  );
}