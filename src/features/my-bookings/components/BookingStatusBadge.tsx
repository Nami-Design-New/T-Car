"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { FiCalendar, FiClock } from "react-icons/fi";
import {
  orderStatusTone,
  type BookingStatus,
  type OrderStatus,
  type OrderStatusTone,
} from "@/features/orders";

interface Props {
  /** BookingStatus/label remain for the not-yet-migrated O3 details hero. */
  status: OrderStatus | BookingStatus;
  label?: string;
  dateTime: string;
  lateHours?: number | null;
  className?: string;
}

const TONE_CLASSES: Record<OrderStatusTone, string> = {
  primary: "bg-primary-100 text-action-primary",
  warning: "bg-warning-50 text-status-warning",
  success: "bg-success-50 text-status-success",
  error: "bg-status-error-background text-status-error",
};

export default function BookingStatusBadge({
  status,
  label,
  dateTime,
  lateHours,
  className,
}: Props) {
  const t = useTranslations("myBookings.status");
  // TODO(O3): drop the legacy upcoming/completed bridge with BookingStatus.
  const tone =
    status === "upcoming"
      ? "warning"
      : status === "completed"
        ? "success"
        : orderStatusTone(status);
  const statusLabel =
    label ??
    (status === "upcoming"
      ? t("coming")
      : status === "completed"
        ? t("complete")
        : t(status));

  return (
    <div
      className={clsx(
        "flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="shrink-0 font-bold">{statusLabel}</span>
      <span className="flex min-w-0 items-center gap-1 text-xs font-normal">
        <FiCalendar aria-hidden="true" />
        {dateTime}
      </span>
      {status === "late" && lateHours != null ? (
        <span className="flex w-full items-center gap-1 text-xs font-semibold">
          <FiClock aria-hidden="true" />
          {t("lateHours", { hours: lateHours })}
        </span>
      ) : null}
    </div>
  );
}
