"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiStar } from "react-icons/fi";
import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import ReviewsModal from "./ReviewsModal";
import type { Review } from "../model";

const linkIcon = ICONS.link;

interface Props {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  className?: string;
}

/** Compact company rating next to the showroom name; opens the reviews modal. */
export default function ReviewsRatingButton({
  rating,
  reviewsCount,
  reviews,
  className,
}: Props) {
  const t = useTranslations("carDetails.reviews");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          "text-text-primary inline-flex shrink-0 items-center gap-1.5 border-0 bg-transparent p-0 text-base font-bold",
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label={t("viewAll")}
      >
        <Image
          alt=""
          src={linkIcon.src}
          width={linkIcon.width}
          height={linkIcon.height}
          className="block size-3"
        />
        <FiStar
          aria-hidden="true"
          className="fill-status-warning text-status-warning size-4.5"
        />
        <span>{rating.toFixed(1)}</span>
      </button>

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
