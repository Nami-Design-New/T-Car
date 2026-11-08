"use client";

import { useLocale, useTranslations } from "next-intl";
import { bookingInstant } from "@/features/orders";

interface Props {
  /** The API `created_at`, 'YYYY-MM-DD HH:mm:ss' in Riyadh time. */
  createdAt: string;
}

/** When the booking was placed, e.g. "29 نوفمبر 2026، 8:00 م". */
export default function BookingOrderTime({ createdAt }: Props) {
  const t = useTranslations("myBookings.dates");
  const locale = useLocale();
  const value = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    // A fixed zone: the server and the browser render the same text.
    timeZone: "Asia/Riyadh",
  }).format(bookingInstant(createdAt.replace(" ", "T")));

  return (
    <div className="text-text-primary flex items-center justify-between gap-3 text-sm leading-relaxed">
      <span className="text-text-primary">{t("orderTime")}</span>
      <span className="text-text-subtle tabular-nums">{value}</span>
    </div>
  );
}
