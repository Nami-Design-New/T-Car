'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiStar, FiX } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';
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
  const t = useTranslations('myBookings.review');
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
    <Dialog open onClose={onClose} label={t('dialogLabel')}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close_btn" onClick={onClose} aria-label={t('close')}>
          <FiX />
        </button>

        <h3>{t('title')}</h3>
        <p className="review-modal-subtitle">{t('subtitle')}</p>

        <div className="review-modal-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= (hoverRating || rating) ? 'filled' : ''}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={t('stars', { count: star })}
            >
              <FiStar />
            </button>
          ))}
        </div>

        <textarea
          placeholder={t('placeholder')}
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
          {submitting ? t('sending') : t('submit')}
        </button>
      </div>
    </Dialog>
  );
}
