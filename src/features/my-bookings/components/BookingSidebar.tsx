"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { FiStar } from "react-icons/fi";
import { canRate, isDraft, type Order } from "@/features/orders";
import { formatAmount } from "@/shared/lib/format";
import { HtmlContent } from "@/shared/ui/HtmlContent";
import { useBookingActions } from "../hooks/useBookingActions";
import { ICONS } from "@/shared/config/assets";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";

const BookingReviewModal = dynamic(() => import("./BookingReviewModal"), {
  ssr: false,
});

interface Props {
  booking: Order;
}

export default function BookingSidebar({ booking }: Props) {
  const t = useTranslations("myBookings.sidebar");
  const [showReview, setShowReview] = useState(false);
  const { submitting, review } = useBookingActions(booking.id);
  const showReviewAction = !isDraft(booking) && canRate(booking);

  return (
    <aside className="border-stroke-light bg-surface-elevated sticky top-6 flex flex-col gap-4 rounded-lg border p-6 max-[860px]:static">
      <h3 className="text-text-primary m-0 text-base font-bold">
        {t("priceDetails")}
      </h3>

      <PriceRow
        label={t("price")}
        amount={booking.price}
        hint={`${booking.count} × ${formatAmount(booking.carPrice)}`}
      />
      <PriceRow label={t("deliveryFee")} amount={booking.deliveryFee} />
      <PriceRow label={t("serviceFee")} amount={booking.serviceFee} />
      <PriceRow label={t("tammFee")} amount={booking.completionFee} />
      <PriceRow label={t("discount")} amount={booking.discount} />
      <PriceRow label={t("totalBeforeTax")} amount={booking.totalPrice} />
      <PriceRow
        label={t("tax")}
        amount={booking.taxValue}
        hint={
          booking.taxRateType === "percent"
            ? `${formatAmount(booking.taxRate)}%`
            : undefined
        }
      />
      <PriceRow label={t("total")} amount={booking.finalPrice} total />

      {booking.status === "cancelled" ? (
        <div className="border-stroke-light border-t pt-2">
          <PriceRow
            label={t("cancellationFee")}
            amount={booking.cancellationFee}
          />
          <PriceRow label={t("refundAmount")} amount={booking.refundAmount} />
        </div>
      ) : null}

      {booking.terms ? (
        <div className="border-stroke-light border-t pt-4">
          <h3 className="text-text-primary mb-2 text-sm font-bold">
            {t("terms")}
          </h3>
          <HtmlContent
            html={booking.terms}
            className="text-text-subtle text-sm leading-relaxed"
          />
        </div>
      ) : null}

      {showReviewAction ? (
        <div className="mt-1 flex flex-col gap-2.5">
          <button
            type="button"
            className="bg-action-primary hover:bg-action-primary/90 flex h-11 items-center justify-center gap-2 rounded-md border-0 text-sm font-bold text-white transition"
            onClick={() => setShowReview(true)}
          >
            <FiStar size={16} />
            {t("review")}
          </button>
        </div>
      ) : null}

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

function PriceRow({
  label,
  amount,
  hint,
  total = false,
}: {
  label: string;
  amount: number;
  hint?: string;
  total?: boolean;
}) {
  const t = useTranslations("myBookings.sidebar");
  return (
    <div
      className={cn(
        "border-stroke-light flex items-center justify-between gap-3 border-x-0 border-t-0 border-dashed py-2 last:border-0",
        total ? "border-b-0" : "border-b",
      )}
    >
      <span className={"text-text-subtle text-sm"}>{label}</span>
      {hint ? <p className="text-text-subtle mx-auto">{hint}</p> : null}
      <span
        className={cn(
          "flex items-center justify-between tabular-nums",
          total
            ? "text-action-primary text-2xl font-bold"
            : "text-text-primary text-lg font-semibold",
        )}
      >
        <span className="ms-1 flex items-center gap-1">
          {formatAmount(amount)}
          <Image
            src={ICONS.riyal.src}
            width={ICONS.riyal.width}
            height={ICONS.riyal.height}
            alt={t("currency")}
          />
        </span>
      </span>
    </div>
  );
}
