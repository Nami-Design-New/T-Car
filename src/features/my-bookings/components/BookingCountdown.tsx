'use client';

import { useEffect, useState } from 'react';

interface Props {
  pickupDateTime: string;
  targetDateTime: string;
}

function getState(start: Date, target: Date) {
  const now = Date.now();

  const diff = Math.max(0, target.getTime() - now);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: diff <= 0,
  };
}

export default function BookingCountdown({
  pickupDateTime,
  targetDateTime,
}: Props) {
  const start = new Date(pickupDateTime);
  const target = new Date(targetDateTime);

  const [state, setState] = useState(() =>
    getState(start, target)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getState(start, target));
    }, 1000);

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
      <h3>الوقت المتبقي لإنهاء الحجز</h3>

      <div className="countdown-units">
        <div className="unit">
          <span className="number">
            {String(state.days).padStart(2, '0')}
          </span>

          <span className="label">يوم</span>
        </div>

        <span className="separator">:</span>

        <div className="unit">
          <span className="number">
            {String(state.hours).padStart(2, '0')}
          </span>

          <span className="label">ساعة</span>
        </div>

        <span className="separator">:</span>

        <div className="unit">
          <span className="number">
            {String(state.minutes).padStart(2, '0')}
          </span>

          <span className="label">دقيقة</span>
        </div>
      </div>
    </div>
  );
}