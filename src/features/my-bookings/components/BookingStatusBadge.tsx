"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { FiCalendar, FiClock } from "react-icons/fi";
import {
  orderStatusTone,
  type OrderStatus,
  type OrderStatusTone,
} from "@/features/orders";

interface Props {
  status: OrderStatus;
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
  dateTime,
  lateHours,
  className,
}: Props) {
  const t = useTranslations("myBookings.status");
  const tone = orderStatusTone(status);
  const statusLabel = t(status);

  return (
    <div
      className={clsx(
        "flex w-full min-w-0 flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1 md:px-4 md:py-2",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="shrink-0 font-bold">{statusLabel}</span>
      <div className="flex min-w-0 items-center gap-1 text-xs leading-3 font-normal">
        <FiCalendar aria-hidden="true" />
        <p className="block">{dateTime}</p>
      </div>
      {status === "late" && lateHours != null ? (
        <div className="flex w-full items-center gap-1 text-xs leading-3 font-semibold">
          <FiClock aria-hidden="true" className="size-3" />
          <p className="block">{t("lateHours", { hours: lateHours })}</p>
        </div>
      ) : null}
    </div>
  );
}
