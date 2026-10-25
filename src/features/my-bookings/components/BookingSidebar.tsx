"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { FiStar } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import { useBookingActions } from "../hooks/useBookingActions";
const BookingReviewModal = dynamic(() => import("./BookingReviewModal"), {
  ssr: false,
});

interface Props {
  bookingId: string;
  pricePerDay: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  pointsUsed: number;
  total: number;
}
export default function BookingSidebar({
  bookingId,
  pricePerDay,
  days,
  subtotal,
  vatRate,
  vat,
  pointsUsed,
  total,
}: Props) {
  const t = useTranslations("myBookings.sidebar");
  const [showReview, setShowReview] = useState(false);
  const { submitting, review } = useBookingActions(bookingId);

  return (
    <aside className="sticky top-6 flex flex-col gap-4 rounded-lg border border-stroke-light bg-surface-elevated p-6 max-[860px]:static">
      <h3 className="m-0 text-base font-bold text-text-primary">
        {t("priceDetails")}
      </h3>

      <div className="flex items-center justify-between py-2">
        <span className="text-[0.9rem] font-semibold tabular-nums text-text-primary">
          {formatCurrency(pricePerDay)}
        </span>
        <span className="text-[0.85rem] text-text-subtle">{t("price")}</span>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-[0.9rem] font-semibold tabular-nums text-text-primary">
          {formatCurrency(subtotal)}{" "}
          <small className="ms-1 text-text-subtle">
            {days} × {formatCurrency(pricePerDay)}
          </small>
        </span>
        <span className="text-[0.85rem] text-text-subtle">{t("subtotal")}</span>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-[0.9rem] font-semibold tabular-nums text-text-primary">
          {formatCurrency(vat)}{" "}
          <small className="ms-1 text-text-subtle">{vatRate}%</small>
        </span>
        <span className="text-[0.85rem] text-text-subtle">{t("vat")}</span>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-[0.9rem] font-semibold tabular-nums text-text-primary">
          -{formatCurrency(pointsUsed)}
        </span>

        <span className="text-[0.85rem] text-text-subtle">{t("points")}</span>
      </div>
      <div className="mt-1 flex items-center justify-between  pt-4">
        <span className="text-xl font-extrabold tabular-nums text-action-primary">
          {formatCurrency(total)}
        </span>
        <span className="font-bold text-text-primary">{t("total")}</span>
      </div>

      <div className="mt-1 flex flex-col gap-2.5">
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-md border-0 bg-action-primary text-sm font-bold text-white transition hover:bg-action-primary/90"
          onClick={() => setShowReview(true)}
        >
          <FiStar size={16} />
          {t("review")}
        </button>
      </div>

      {showReview && (
        <BookingReviewModal
          submitting={submitting}
          onSubmit={review}
          onClose={() => setShowReview(false)}
        />
      )}
    </aside>
  );
}
