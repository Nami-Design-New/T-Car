'use client';

import { useState } from 'react';
import { FiStar, FiX } from 'react-icons/fi';

interface Props {
  reference: string;
  onClose: () => void;
}

export default function BookingReviewModal({ reference, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rating || submitting) return;

    setSubmitting(true);
    try {
      await fetch(`/api/bookings/${reference}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close_btn" onClick={onClose} aria-label="إغلاق">
          <FiX />
        </button>

        <h3>تقييمك يهمنا</h3>
        <p className="review-modal-subtitle">شاركنا تجربتك مع هذا الحجز</p>

        <div className="review-modal-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= (hoverRating || rating) ? 'filled' : ''}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} نجوم`}
            >
              <FiStar />
            </button>
          ))}
        </div>

        <textarea
          placeholder="اكتب تجربتك مع السيارة والمعرض..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
        />

        <button
          className="review-modal-submit"
          onClick={handleSubmit}
          disabled={!rating || submitting}
        >
          {submitting ? 'جارٍ الإرسال...' : 'إرسال'}
        </button>
      </div>
    </div>
  );
}
