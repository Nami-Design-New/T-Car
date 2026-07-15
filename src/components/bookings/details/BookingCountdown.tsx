'use client';

import { useEffect, useState } from 'react';

interface Props {
  pickupDateTime: string;
  targetDateTime: string; // ISO — نهاية الحجز
}

function getState(start: Date, target: Date) {
  const now = Date.now();
  const total = target.getTime() - start.getTime();
  const diff = Math.max(0, target.getTime() - now);
  const elapsed = Math.min(1, Math.max(0, (now - start.getTime()) / total));

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return { days, hours, minutes, expired: diff <= 0, elapsedPct: elapsed * 100 };
}

export default function BookingCountdown({ pickupDateTime, targetDateTime }: Props) {
  const start = new Date(pickupDateTime);
  const target = new Date(targetDateTime);
  const [state, setState] = useState(() => getState(start, target));

  useEffect(() => {
    const interval = setInterval(() => setState(getState(start, target)), 60000);
    return () => clearInterval(interval);
  }, [pickupDateTime, targetDateTime]);

  if (state.expired) {
    return (
      <div className="booking-countdown expired">
        <p>انتهت مدة الحجز</p>
      </div>
    );
  }

  return (
    <div className="booking-countdown">
      <div className="countdown-left">
        <span className="countdown-title">الوقت المتبقي لإنهاء الحجز</span>
        <span className="countdown-sub">{Math.round(state.elapsedPct)}% من مدة الحجز مضت</span>

        <div className="countdown-gauge">
          <span style={{ width: `${state.elapsedPct}%` }} />
        </div>
      </div>

      <div className="countdown-units">
        <div className="unit">
          <span className="number">{String(state.days).padStart(2, '0')}</span>
          <span className="label">يوم</span>
        </div>
        <span className="separator">:</span>
        <div className="unit">
          <span className="number">{String(state.hours).padStart(2, '0')}</span>
          <span className="label">ساعة</span>
        </div>
        <span className="separator">:</span>
        <div className="unit">
          <span className="number">{String(state.minutes).padStart(2, '0')}</span>
          <span className="label">دقيقة</span>
        </div>
      </div>
    </div>
  );
}
