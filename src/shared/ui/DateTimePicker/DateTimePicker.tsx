"use client";
import { useState, useRef, useEffect } from "react";
import { FiChevronRight, FiChevronLeft, FiClock } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
interface DateTimeValue {
  date: string;
  time: string;
}
export interface DateTimePickerProps {
  label: string;
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  minDate?: string;
  placeholder: string;
}
const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
});
function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  placeholder,
}: DateTimePickerProps) {
  const t = useTranslations("dateTimePicker");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() =>
    value.date ? new Date(value.date) : new Date(),
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!value.date) return;
    const [year, month, day] = value.date.split("-").map(Number);
    if (year && month && day) setCursor(new Date(year, month - 1, day));
  }, [value.date]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const min = minDate ? new Date(minDate) : null;
  min?.setHours(0, 0, 0, 0);
  const cells: (Date | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from(
      { length: new Date(year, month + 1, 0).getDate() },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];
  const displayText = value.date
    ? `${new Date(value.date).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })}${value.time ? ` - ${value.time}` : ""}`
    : placeholder;
  return (
    <div className="dt-picker relative min-w-0 flex-1" ref={ref}>
      <button
        type="button"
        className="dt-picker-trigger flex w-full cursor-pointer flex-col items-start border-0 bg-transparent px-5 py-2.5 text-start max-sm:px-2 max-sm:py-1"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="dt-picker-label text-text-subtle text-[0.7rem] font-semibold">
          {label}
        </span>
        <span className="dt-picker-value text-text-primary w-full truncate text-[0.9rem] font-bold max-sm:text-[0.78rem]">
          {displayText}
        </span>
      </button>
      {open && (
        <div className="dt-picker-popover bg-surface-elevated absolute start-0 top-[calc(100%+12px)] z-50 w-80 rounded-lg p-4 shadow-[0_8px_24px_rgba(30,30,30,0.1)]">
          <div className="dt-picker-calendar-header mb-3 flex items-center justify-between">
            <button
              type="button"
              className="bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary grid size-7 cursor-pointer place-items-center rounded-sm border-0"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label={t("previousMonth")}
            >
              <FiChevronLeft className="rtl:scale-x-[-1]" />
            </button>
            <span className="text-text-primary text-[0.9rem] font-bold">
              {t(`months.${month}`)} {year}
            </span>
            <button
              type="button"
              className="bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary grid size-7 cursor-pointer place-items-center rounded-sm border-0"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label={t("nextMonth")}
            >
              <FiChevronRight className="rtl:scale-x-[-1]" />
            </button>
          </div>
          <div className="dt-picker-weekdays mb-1 grid grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className="text-text-subtle text-center text-[0.7rem] font-semibold"
              >
                {t(`weekdays.${index}`)}
              </span>
            ))}
          </div>
          <div className="dt-picker-days grid grid-cols-7 gap-0.5">
            {cells.map((day, index) => {
              if (!day)
                return (
                  <span key={index} className="empty pointer-events-none" />
                );
              const iso = toISODate(day);
              const disabled = min ? day < min : false;
              const selected = value.date === iso;
              const today = toISODate(new Date()) === iso;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  className={cn(
                    "text-text-primary hover:bg-surface-card-primary disabled:text-text-placeholder aspect-square cursor-pointer rounded-sm border-0 bg-transparent text-[0.8rem] transition duration-150 disabled:cursor-not-allowed",
                    today && "text-action-primary font-bold",
                    selected && "bg-action-primary! text-text-on-action!",
                  )}
                  onClick={() => onChange({ ...value, date: iso })}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="dt-picker-time-section border-stroke-light mt-3.5 border-t pt-3.5">
            <span className="dt-picker-time-label text-text-subtle mb-2 flex items-center gap-1.5 text-[0.8rem] font-semibold">
              <FiClock /> {t("time")}
            </span>
            <div className="dt-picker-time-list flex scrollbar-none gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[0.78rem] whitespace-nowrap",
                    value.time === slot
                      ? "border-action-primary bg-action-primary text-text-on-action"
                      : "bg-surface-elevated text-text-primary border-stroke-light",
                  )}
                  onClick={() => onChange({ ...value, time: slot })}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="dt-picker-confirm bg-action-primary text-text-on-action disabled:bg-surface-on-background disabled:text-text-placeholder mt-3.5 h-[42px] w-full cursor-pointer rounded-md border-0 font-bold disabled:cursor-not-allowed"
            disabled={!value.date || !value.time}
            onClick={() => setOpen(false)}
          >
            {t("done")}
          </button>
        </div>
      )}
    </div>
  );
}
