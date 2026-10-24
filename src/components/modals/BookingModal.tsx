"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { formatCurrency } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { cn } from "@/shared/lib/cn";
import type { BookingDetails } from "@/features/booking";
import { TIME_SLOTS } from "@/features/booking/validation";

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (details: BookingDetails) => void;
  modal?: boolean;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
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
];
const VAT_RATE = 0.15;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function BookingModal({
  open,
  onClose,
  pricePerDay,
  onConfirm,
  modal = true,
}: Props) {
  const t = useTranslations("booking.daily");
  const [cursor, setCursor] = useState(new Date());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [time, setTime] = useState<(typeof TIME_SLOTS)[number]>("9:00 AM");
  const [notes, setNotes] = useState("");
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const cells: (Date | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from(
      { length: new Date(year, month + 1, 0).getDate() },
      (_, index) => new Date(year, month, index + 1),
    ),
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePick = (day: Date) => {
    if (!range.start || range.end) {
      setRange({ start: day, end: null });
      return;
    }
    setRange(
      day < range.start
        ? { start: day, end: range.start }
        : { start: range.start, end: day },
    );
  };

  const totalDays =
    range.start && range.end
      ? Math.max(
          1,
          Math.round((range.end.getTime() - range.start.getTime()) / 86400000),
        )
      : 1;
  const subtotal = pricePerDay * totalDays;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  const formatShort = (date: Date) =>
    `${date.getDate()} ${t(`months.${MONTHS[date.getMonth()]}`)} ${date.getFullYear()}`;

  const handleConfirmClick = () => {
    if (!range.start || !range.end) return;
    onConfirm({
      startDate: range.start,
      endDate: range.end,
      time,
      notes,
      days: totalDays,
      pricePerDay,
      subtotal,
      vat,
      total,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      modal={modal}
      label={t("newBooking")}
    >
      <Dialog.Header>
        <Dialog.Title>{t("newBooking")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="mt-6 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="relative flex min-h-0 flex-1 flex-col rounded-xl bg-surface-elevated p-6 animate-[popup_0.35s_ease]">
          <div className="mb-5.5">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border-0 bg-black/4 text-text-primary transition hover:bg-action-primary/10 hover:text-action-primary"
                aria-label={t("previousMonth")}
                onClick={() => setCursor(new Date(year, month - 1, 1))}
              >
                <FiChevronLeft className="mirror-in-rtl" aria-hidden="true" />
              </button>
              <span className="text-base font-bold text-text-primary">
                {t(`months.${MONTHS[month]}`)} {year}
              </span>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border-0 bg-black/4 text-text-primary transition hover:bg-action-primary/10 hover:text-action-primary"
                aria-label={t("nextMonth")}
                onClick={() => setCursor(new Date(year, month + 1, 1))}
              >
                <FiChevronRight className="mirror-in-rtl" aria-hidden="true" />
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="text-center text-[0.72rem] font-semibold text-text-subtle"
                >
                  {t(`weekdays.${day}`)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, index) => {
                if (!day) return <span key={index} className="flex h-10" />;
                const disabled = day < today;
                const isStart = Boolean(
                  range.start && sameDay(day, range.start),
                );
                const isEnd = Boolean(range.end && sameDay(day, range.end));
                const inRange = Boolean(
                  range.start &&
                  range.end &&
                  day > range.start &&
                  day < range.end,
                );
                return (
                  <span
                    key={index}
                    className={cn(
                      "flex h-10 items-center justify-center",
                      inRange && "bg-action-primary/15",
                      isStart && "rounded-s bg-action-primary/15",
                      isEnd && "rounded-e bg-action-primary/15",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      className={cn(
                        "size-full rounded-md border-0 bg-transparent text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-placeholder",
                        (isStart || isEnd) &&
                          "bg-action-primary! font-bold text-text-on-action!",
                      )}
                      onClick={() => handlePick(day)}
                    >
                      {day.getDate()}
                    </button>
                  </span>
                );
              })}
            </div>
            {range.start && (
              <div className="mt-3 rounded-md bg-surface-card-primary px-3 py-2 text-center text-xs text-text-subtle">
                {range.end
                  ? `${formatShort(range.start)} ${t("to")} ${formatShort(range.end)}`
                  : `${formatShort(range.start)} — ${t("chooseEndDate")}`}
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              {t("pickupTime")}
            </label>
            <Swiper
              slidesPerView={4.5}
              spaceBetween={6}
              watchOverflow
              className="rounded-md border border-stroke-light bg-surface-card-primary p-1.5"
            >
              {TIME_SLOTS.map((slot) => (
                <SwiperSlide key={slot} className="!h-auto">
                  <button
                    type="button"
                    aria-label={slot}
                    className={cn(
                      "flex min-h-9 w-full items-center justify-center rounded-md border-0 px-2 py-2 text-xs text-text-primary",
                      time === slot &&
                        "bg-action-primary! font-bold text-text-on-action!",
                    )}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-primary">
              {t("additionalDetails")}
            </label>
            <textarea
              rows={4}
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-y rounded-md border border-stroke-light bg-surface-elevated px-4 py-3.5 text-[15px] transition focus:border-action-primary focus:outline-none focus:ring-4 focus:ring-action-primary/15"
            />
          </div>

          <div className="flex items-center gap-3.5 border-t border-stroke-light pt-4">
            <Button
              type="button"
              className="order-2 flex-1"
              disabled={!range.start || !range.end}
              onClick={handleConfirmClick}
            >
              {t("continue")}
            </Button>
            <div className="flex flex-col items-start">
              <span className="text-xs text-text-subtle">{t("total")}</span>
              <h3 className="m-0 text-xl font-extrabold text-action-primary">
                {formatCurrency(total)}
              </h3>
            </div>
          </div>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
