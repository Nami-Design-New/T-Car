'use client';

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import type { Review } from '@app-types/car';
import ReviewsModal from '@/components/car-details/ReviewsModal';

interface Props {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}

function ratingLabel(rating: number) {
  if (rating >= 4.5) return 'ممتاز';
  if (rating >= 4) return 'جيد جدًا';
  if (rating >= 3) return 'جيد';
  return 'مقبول';
}

export default function ReviewsSummaryCard({ rating, reviewsCount, reviews }: Props) {
  const [showAll, setShowAll] = useState(false);
  const preview = reviews.slice(0, 2);

  return (
    <section id="reviews-summary" className="reviews-summary-card">
      <div className="reviews-summary-header">
        <h3>التقييمات</h3>
      </div>

      <div className="reviews-summary-overall">
        <div className="reviews-summary-label">
          <span className="label-text">{ratingLabel(rating)}</span>
          <div className="stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar key={i} className={i < Math.round(rating) ? 'filled' : ''} />
            ))}
          </div>
          <span className="count">({reviewsCount})</span>
        </div>

        <span className="reviews-summary-score">{rating}</span>
      </div>

      <div className="reviews-summary-list">
        {preview.map((review) => (
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

      {reviews.length > preview.length && (
        <button type="button" className="reviews-summary-more" onClick={() => setShowAll(true)}>
          عرض كل التقييمات ({reviewsCount})
        </button>
      )}

      <ReviewsModal
        open={showAll}
        onClose={() => setShowAll(false)}
        rating={rating}
        reviewsCount={reviewsCount}
        reviews={reviews}
      />
    </section>
  );
}