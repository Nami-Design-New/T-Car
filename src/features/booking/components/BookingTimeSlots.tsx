"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/shared/lib/cn";

interface Props {
  slots: string[];
  value: string;
  label: string;
  onChange: (slot: string) => void;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  error?: ReactNode;
}

function splitSlot(slot: string, locale: string) {
  const formatted = slot.trim();
  const match = formatted.match(/^(\d{1,2})(?::(\d{2}))?(?:\s+(.+))?$/);

  if (!match) return { number: formatted, text: undefined };

  const hour = Number(match[1]);
  const minutes = match[2];

  if (match[3] || hour > 23) {
    return {
      number: minutes ? `${hour}:${minutes}` : String(hour),
      text: match[3],
    };
  }

  const isArabic = locale.startsWith("ar");
  const period = hour >= 12
    ? isArabic ? "مساءً" : "PM"
    : isArabic ? "صباحًا" : "AM";
  const hour12 = hour % 12 || 12;

  return {
    number: minutes ? `${hour12}:${minutes}` : String(hour12),
    text: period,
  };
}

export default function BookingTimeSlots({
  slots,
  value,
  label,
  onChange,
  loading = false,
  loadingText,
  emptyText,
  error,
}: Props) {
  const locale = useLocale();

  return (
    <div className="mb-4.5">
      <label className="mb-2 block text-start text-sm font-bold text-text-primary">
        {label}
      </label>
      {slots.length > 0 ? (
        <Swiper
          slidesPerView={4.5}
          spaceBetween={6}
          watchOverflow
          className="time-swiper p-1.5"
        >
          {slots.map((slot) => {
            const { number, text } = splitSlot(slot, locale);

            return (
              <SwiperSlide key={slot} className="h-auto!">
                <button
                  type="button"
                  aria-label={text ? `${number} ${text}` : number}
                  aria-pressed={value === slot}
                  className={cn(
                    "flex min-h-9 w-full cursor-pointer border border-stroke-light items-center justify-center gap-1 rounded-md  px-2 py-4 text-xs  transition",
                    value === slot ?
                      "bg-action-primary! font-bold text-text-on-action! shadow-[0_3px_8px_rgba(31,127,250,0.2)]":"text-text-primary",
                  )}
                  onClick={() => onChange(slot)}
                >
                  <span dir="ltr" className={cn("font-semibold text-text-primary" , value === slot && "text-text-on-action!")}>
                    {number}
                  </span>
                  {text && (
                    <span dir="ltr" className={cn("font-semibold text-text-subtle" , value === slot && "text-text-on-action!")}>
                      {text}
                    </span>
                  )}
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      ) : (
        !loading &&
        emptyText && (
          <p
            className="rounded-md bg-surface-card-primary px-3 py-3 text-sm text-text-subtle"
            role="status"
          >
            {emptyText}
          </p>
        )
      )}
      {loading && loadingText && (
        <p className="text-sm text-text-subtle" role="status">
          {loadingText}
        </p>
      )}
      {error}
    </div>
  );
}
