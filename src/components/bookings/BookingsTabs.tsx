'use client';

import type { BookingStatus } from '@app-types/car';

interface Props {
  active: BookingStatus;
  onChange: (tab: BookingStatus) => void;
  activeCount: number;
  upcomingCount: number;
  completedCount: number;
}

export default function BookingsTabs({ active, onChange, activeCount, upcomingCount, completedCount }: Props) {
  return (
    <div className="bookings-tabs">
      <button type="button" className={active === 'active' ? 'active' : ''} onClick={() => onChange('active')}>
        حالية
        <span className="count">{activeCount}</span>
      </button>

      <button type="button" className={active === 'upcoming' ? 'active' : ''} onClick={() => onChange('upcoming')}>
        قادم
        <span className="count">{upcomingCount}</span>
      </button>

      <button type="button" className={active === 'completed' ? 'active' : ''} onClick={() => onChange('completed')}>
        مكتمل
        <span className="count">{completedCount}</span>
      </button>
    </div>
  );
}