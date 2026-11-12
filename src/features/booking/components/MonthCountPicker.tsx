"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ICONS } from "@/shared/config/assets";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

interface Props {
  /** Number of rental months (E1/E2 `count`). */
  value: number;
  onChange: (months: number) => void;
  min?: number;
  max?: number;
  /** The rental period the count produces, shown under the slider. */
  startDate: Date;
  endDate: Date;
}

const stepButtonClass =
  "grid size-7 place-items-center rounded-md border-0 bg-white disabled:cursor-not-allowed disabled:opacity-50";

/** Monthly booking: the months counter (+ / −), the 1–12 slider, and the resulting period. */
export default function MonthCountPicker({
  value,
  onChange,
  min = 1,
  max = 12,
  startDate,
  endDate,
}: Props) {
  const t = useTranslations("booking.daily");
  const tm = useTranslations("booking.monthly");
  const change = (months: number) =>
    onChange(Math.min(max, Math.max(min, months)));
  const progress = (value / max) * 100;
  const formatShort = (date: Date) =>
    `${date.getDate()} ${t(`months.${MONTHS[date.getMonth()]}`)} ${date.getFullYear()}`;

  return (
    <div className="mb-5 rounded-[14px] bg-[#eaf3ff] px-5.5 py-5 text-center">
      <div className="mb-2 text-sm text-[#101820]">{tm("monthsCount")}</div>
      <div className="mx-auto mb-4.5 flex max-w-56.25 items-center justify-between">
        <button
          type="button"
          className={stepButtonClass}
          aria-label={tm("increase")}
          onClick={() => change(value + 1)}
          disabled={value >= max}
        >
          <Image
            src={ICONS.plus.src}
            width={ICONS.plus.width}
            height={ICONS.plus.height}
            alt=""
            aria-hidden="true"
          />
        </button>
        <strong className="text-[32px] leading-none text-[#101820]">
          {value}
        </strong>
        <button
          type="button"
          className={stepButtonClass}
          aria-label={tm("decrease")}
          onClick={() => change(value - 1)}
          disabled={value <= min}
        >
          <Image
            src={ICONS.minus.src}
            width={ICONS.minus.width}
            height={ICONS.minus.height}
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="relative mb-3.5 h-15 overflow-hidden rounded-[13px] bg-[#a4a4a4] text-white">
        <span
          className="absolute inset-y-0 inset-s-0 rounded-[13px] bg-[#287ff0] transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm">
          {tm("months", { count: value })}
        </span>
        {/* The thumb with an arrow on each side, pointing outwards in both directions. */}
        <span
          className="pointer-events-none absolute top-1/2 -translate-y-1/2"
          style={{ insetInlineStart: `calc(${progress}% - 28px)` }}
          aria-hidden="true"
        >
          {/* LTR only inside, so the outer position still follows the page direction. */}
          <span className="flex items-center gap-1" dir="ltr">
            <Image
              src={ICONS.caretLeft.src}
              width={ICONS.caretLeft.width}
              height={ICONS.caretLeft.height}
              alt=""
            />
            <span className="size-6 rounded-full border-2 border-white bg-[#287ff0] shadow-sm" />
            <Image
              src={ICONS.caretRight.src}
              width={ICONS.caretRight.width}
              height={ICONS.caretRight.height}
              alt=""
            />
          </span>
        </span>
        <input
          type="range"
          className="absolute inset-0 z-2 m-0 h-full w-full cursor-pointer opacity-0"
          min={min}
          max={max}
          step="1"
          value={value}
          aria-label={tm("sliderLabel")}
          onChange={(event) => change(Number(event.target.value))}
        />
      </div>

      <div className="text-[13px] text-[#101820]">
        {formatShort(startDate)} <strong>{t("to")}</strong>{" "}
        {formatShort(endDate)}
      </div>
    </div>
  );
}
