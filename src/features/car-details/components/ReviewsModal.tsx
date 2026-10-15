'use client';

import { useTranslations } from 'next-intl';
import { FiStar } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';
import type { Review } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}

export default function ReviewsModal({ open, onClose, rating, reviewsCount, reviews }: Props) {
  const t = useTranslations('carDetails.reviews');
  return (
    <Dialog open={open} onClose={onClose} size="lg" className="reviews_modal">
      <Dialog.Header>
        <Dialog.Title className="reviews_modal_title">{t('title')}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="reviews_modal_scroll">
        <div className="reviews-summary-overall">
          <div className="reviews-summary-label">
            <span className="label-text">
              {t(
                rating >= 4.5
                  ? 'excellent'
                  : rating >= 4
                    ? 'veryGood'
                    : rating >= 3
                      ? 'good'
                      : 'acceptable'
              )}
            </span>
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar key={i} className={i < Math.round(rating) ? 'filled' : ''} />
              ))}
            </div>
            <span className="count">({reviewsCount})</span>
          </div>

          <span className="reviews-summary-score">{rating}</span>
        </div>

        <div className="reviews_modal_list">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-item-head">
                <span className="review-item-name">{review.name}</span>
                <span className="review-item-date">{review.date}</span>
              </div>

              <div className="review-item-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar key={i} className={i < review.rating ? 'filled' : ''} />
                ))}
              </div>

              <p className="review-item-comment">{review.comment}</p>
            </div>
          ))}
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
