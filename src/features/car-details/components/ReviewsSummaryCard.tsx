"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiStar } from "react-icons/fi";
import ReviewsModal from "./ReviewsModal";
import type { Review } from "../model";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";

const linkIcon = ICONS.link;
interface Props {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
}

export default function ReviewsSummaryCard({
  rating,
  reviewsCount,
  reviews,
}: Props) {
  const t = useTranslations("carDetails.reviews");
  const [open, setOpen] = useState(false);

  return (
    <>
      <section
        id="reviews-summary"
        className="reviews-summary-card max-lg:hidden border-stroke-light bg-surface-elevated mt-5 rounded-xl border p-5 shadow-[0_2px_8px_rgba(30,30,30,0.06)]"
      >
        <div className="reviews-summary-header mb-3.5">
          <h3 className="text-text-primary m-0 text-[1.05rem] font-bold">
            {t("overall")}
          </h3>
        </div>

        <button
          type="button"
          className="font-inherit mb-0 flex w-full items-center justify-between bg-transparent p-0 pb-4 text-start text-inherit"
          onClick={() => setOpen(true)}
          aria-label={t("viewAll")}
        >
          <div className="reviews-summary-label flex flex-wrap items-center gap-2">
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
              ({reviewsCount} {t("countLabel")})
            </span>
          </div>

          <span className="text-text-primary flex items-center gap-2 text-2xl font-extrabold">
            <Image
              alt="link icon"
              src={linkIcon.src}
              width={linkIcon.width}
              height={linkIcon.height}
              className="block size-3"
            />
            <span className="block">{rating.toFixed(1)}</span>
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
