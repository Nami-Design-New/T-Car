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
      <section id="reviews-summary" className="reviews-summary-card mt-5 rounded-xl border border-stroke-light bg-surface-elevated p-5 shadow-[0_2px_8px_rgba(30,30,30,0.06)]">
        <div className="reviews-summary-header mb-3.5">
          <h3 className="m-0 text-[1.05rem] font-bold text-text-primary">{t('overall')}</h3>
        </div>

        <button
          type="button"
          className="reviews-summary-overall reviews_summary_link mb-0 flex w-full items-center justify-between border-0 border-b border-stroke-light bg-transparent p-0 pb-4 text-start font-inherit text-inherit"
          onClick={() => setOpen(true)}
          aria-label={t('viewAll')}
        >
          <div className="reviews-summary-label flex flex-wrap items-center gap-2">
            <div className="stars flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                  key={i}
                  className={i < Math.round(rating) ? 'fill-status-warning text-status-warning' : 'text-stroke-heavy'}
                />
              ))}
            </div>

            <span className="count text-[0.82rem] text-text-subtle">({reviewsCount} {t('countLabel')})</span>
          </div>

          <span className="reviews-summary-score shrink-0 text-[1.6rem] font-extrabold text-text-primary">
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
