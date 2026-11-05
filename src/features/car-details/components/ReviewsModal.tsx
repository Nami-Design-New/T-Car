"use client";

import { useLocale, useTranslations } from "next-intl";
import { FiStar } from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import type { Review } from "../model";

interface Props {
  open: boolean;
  onClose: () => void;
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}

export default function ReviewsModal({
  open,
  onClose,
  rating,
  reviewsCount,
  reviews,
}: Props) {
  const t = useTranslations("carDetails.reviews");
  const locale = useLocale();
  const formatDate = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    const [, year, month, day] = match;
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  };
  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="min-h-0 scrollbar-none overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden">
        <div className="border-stroke-light mb-4.5 flex items-center justify-between border-b pb-4.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-text text-text-primary font-bold">
              {t(
                rating >= 4.5
                  ? "excellent"
                  : rating >= 4
                    ? "veryGood"
                    : rating >= 3
                      ? "good"
                      : "acceptable",
              )}
            </span>
            <div className="stars flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                  key={i}
                  className={
                    i < Math.round(rating)
                      ? "fill-status-warning text-status-warning"
                      : "text-stroke-heavy"
                  }
                />
              ))}
            </div>
            <span className="count text-text-subtle text-[0.82rem]">
              ({reviewsCount})
            </span>
          </div>

          <span className="reviews-summary-score text-text-primary text-[1.6rem] font-extrabold">
            {rating}
          </span>
        </div>

        <div className="reviews_modal_list flex flex-col gap-4.5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="review-item border-stroke-light border-b pb-4.5 last:border-0 last:pb-0"
            >
              <div className="review-item-head mb-1.5 flex items-center justify-between">
                <span className="review-item-name text-text-primary text-[0.9rem] font-bold">
                  {review.name}
                </span>
                <span className="review-item-date text-text-subtle text-[0.78rem]">
                  {formatDate(review.date)}
                </span>
              </div>

              <div className="review-item-stars mb-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    className={
                      i < review.rating
                        ? "fill-status-warning text-status-warning"
                        : "text-stroke-heavy"
                    }
                  />
                ))}
              </div>

              {review.comment && (
                <p className="review-item-comment text-text-subtle m-0 text-[0.85rem] leading-[1.8]">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
