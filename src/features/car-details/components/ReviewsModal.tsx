'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { FiX, FiStar } from 'react-icons/fi';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const content = (
    <div className="modal_overlay" onClick={onClose}>
      <div className="reviews_modal" onClick={(e) => e.stopPropagation()}>
        <button className="close_btn" onClick={onClose} aria-label={t('close')}>
          <FiX />
        </button>

        <div className="reviews_modal_scroll">
          <h2 className="reviews_modal_title">{t('title')}</h2>

          <div className="reviews-summary-overall">
            <div className="reviews-summary-label">
              <span className="label-text">{t(rating >= 4.5 ? 'excellent' : rating >= 4 ? 'veryGood' : rating >= 3 ? 'good' : 'acceptable')}</span>
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
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
