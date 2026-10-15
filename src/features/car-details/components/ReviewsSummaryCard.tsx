'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiStar } from 'react-icons/fi';
import ReviewsModal from './ReviewsModal';
import type { Review } from '../model';

interface Props {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}

export default function ReviewsSummaryCard({ rating, reviewsCount, reviews }: Props) {
  const t = useTranslations('carDetails.reviews');
  const [open, setOpen] = useState(false);

  return (
    <>
      <section id="reviews-summary" className="reviews-summary-card">
        <div className="reviews-summary-header">
          <h3>{t('overall')}</h3>
        </div>

        <button
          type="button"
          className="reviews-summary-overall reviews_summary_link"
          onClick={() => setOpen(true)}
          aria-label={t('viewAll')}
        >
          <div className="reviews-summary-label">
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                  key={i}
                  className={i < Math.round(rating) ? 'filled' : ''}
                />
              ))}
            </div>

            <span className="count">({reviewsCount} {t('countLabel')})</span>
          </div>

          <span className="reviews-summary-score">
            {rating.toFixed(1)}
          </span>
        </button>
      </section>

      <ReviewsModal
        open={open}
        onClose={() => setOpen(false)}
        rating={rating}
        reviewsCount={reviewsCount}
        reviews={reviews}
      />
    </>
  );
}
