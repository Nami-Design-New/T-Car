'use client';

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

interface Props {
  onSubmit: (rating: number) => void;
}

export default function RateBookingButton({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  if (!open) {
    return (
      <button type="button" className="rate_booking_btn" onClick={() => setOpen(true)}>
        <FiStar /> تقييمك يهمنا
      </button>
    );
  }

  return (
    <div className="rate_booking_panel">
      <p>قيّم تجربتك مع هذا الحجز</p>

      <div className="rate_booking_stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            aria-label={`${i + 1} نجوم`}
          >
            <FiStar className={i < rating ? 'filled' : ''} />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="rate_booking_submit"
        disabled={rating === 0}
        onClick={() => onSubmit(rating)}
      >
        إرسال التقييم
      </button>
    </div>
  );
}