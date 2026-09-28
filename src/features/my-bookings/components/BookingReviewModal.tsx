'use client';

import { useState } from 'react';
import { FiStar, FiX } from 'react-icons/fi';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import type { Result } from '@/shared/lib/result';
import type { BookingReviewInput } from '../model';

interface Props {
  submitting?: boolean;
  onSubmit: (input: BookingReviewInput) => Promise<Result<void>>;
  onClose: () => void;
}

export default function BookingReviewModal({ submitting = false, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [error, setError] = useState<AppError | null>(null);
  const errorMessage = useErrorMessage();

  async function handleSubmit() {
    if (!rating || submitting) return;

    setError(null);
    const result = await onSubmit({ rating, review });
    // On failure the dialog stays open and keeps what the user typed.
    if (result.ok) onClose();
    else setError(result.error);
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

        {error && (
          <p className="text-danger small mb-2" role="alert">
            {errorMessage(error)}
          </p>
        )}

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
