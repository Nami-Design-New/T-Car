'use client';
import { useState, useRef, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft, FiClock } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
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
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
});
function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  placeholder,
}: DateTimePickerProps) {
  const t = useTranslations('dateTimePicker');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => (value.date ? new Date(value.date) : new Date()));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      (_, i) => new Date(year, month, i + 1)
    ),
  ];
  const displayText = value.date
    ? `${new Date(value.date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}${value.time ? ` - ${value.time}` : ''}`
    : placeholder;
  return (
    <div className="dt-picker relative flex-1" ref={ref}>
      <button
        type="button"
        className="dt-picker-trigger flex w-full cursor-pointer flex-col items-start border-0 bg-transparent px-5 py-2.5 text-start"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="dt-picker-label text-[0.7rem] font-semibold text-text-subtle">{label}</span>
        <span className="dt-picker-value text-[0.9rem] font-bold text-text-primary">{displayText}</span>
      </button>
      {open && (
        <div className="dt-picker-popover absolute top-[calc(100%+12px)] start-0 z-50 w-80 rounded-lg bg-surface-elevated p-4 shadow-[0_8px_24px_rgba(30,30,30,0.1)]">
          <div className="dt-picker-calendar-header mb-3 flex items-center justify-between">
            <button
              type="button"
              className="grid size-7 cursor-pointer place-items-center rounded-sm border-0 bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label={t('previousMonth')}
            >
              <FiChevronLeft className="rtl:scale-x-[-1]" />
            </button>
            <span className="text-[0.9rem] font-bold text-text-primary">
              {t(`months.${month}`)} {year}
            </span>
            <button
              type="button"
              className="grid size-7 cursor-pointer place-items-center rounded-sm border-0 bg-surface-on-background text-text-primary hover:bg-surface-card-primary hover:text-action-primary"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label={t('nextMonth')}
            >
              <FiChevronRight className="rtl:scale-x-[-1]" />
            </button>
          </div>
          <div className="dt-picker-weekdays mb-1 grid grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="text-center text-[0.7rem] font-semibold text-text-subtle">{t(`weekdays.${index}`)}</span>
            ))}
          </div>
          <div className="dt-picker-days grid grid-cols-7 gap-0.5">
            {cells.map((day, index) => {
              if (!day) return <span key={index} className="empty pointer-events-none" />;
              const iso = toISODate(day);
              const disabled = min ? day < min : false;
              const selected = value.date === iso;
              const today = toISODate(new Date()) === iso;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    'aspect-square cursor-pointer rounded-sm border-0 bg-transparent text-[0.8rem] text-text-primary transition duration-150 hover:bg-surface-card-primary disabled:cursor-not-allowed disabled:text-text-placeholder',
                    today && 'today font-bold text-action-primary',
                    selected && 'selected bg-action-primary text-text-on-action',
                  )}
                  onClick={() => onChange({ ...value, date: iso })}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="dt-picker-time-section mt-3.5 border-t border-stroke-light pt-3.5">
            <span className="dt-picker-time-label mb-2 flex items-center gap-1.5 text-[0.8rem] font-semibold text-text-subtle">
              <FiClock /> {t('time')}
            </span>
            <div className="dt-picker-time-list flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={cn(
                    'shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-stroke-light bg-surface-elevated px-3 py-1.5 text-[0.78rem] text-text-primary',
                    value.time === slot && 'selected border-action-primary bg-action-primary text-text-on-action',
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
            className="dt-picker-confirm mt-3.5 h-[42px] w-full cursor-pointer rounded-md border-0 bg-action-primary font-bold text-text-on-action disabled:cursor-not-allowed disabled:bg-surface-on-background disabled:text-text-placeholder"
            disabled={!value.date || !value.time}
            onClick={() => setOpen(false)}
          >
            {t('done')}
          </button>
        </div>
      )}
    </div>
  );
}
