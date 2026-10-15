'use client';
import { useState, useRef, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft, FiClock } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import './DateTimePicker.scss';
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
    <div className="dt-picker" ref={ref}>
      <button
        type="button"
        className="dt-picker-trigger"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="dt-picker-label">{label}</span>
        <span className="dt-picker-value">{displayText}</span>
      </button>
      {open && (
        <div className="dt-picker-popover">
          <div className="dt-picker-calendar-header">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label={t('previousMonth')}
            >
              <FiChevronLeft className="mirror-in-rtl" />
            </button>
            <span>
              {t(`months.${month}`)} {year}
            </span>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label={t('nextMonth')}
            >
              <FiChevronRight className="mirror-in-rtl" />
            </button>
          </div>
          <div className="dt-picker-weekdays">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index}>{t(`weekdays.${index}`)}</span>
            ))}
          </div>
          <div className="dt-picker-days">
            {cells.map((day, index) => {
              if (!day) return <span key={index} className="empty" />;
              const iso = toISODate(day);
              const disabled = min ? day < min : false;
              const selected = value.date === iso;
              const today = toISODate(new Date()) === iso;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  className={`${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
                  onClick={() => onChange({ ...value, date: iso })}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="dt-picker-time-section">
            <span className="dt-picker-time-label">
              <FiClock /> {t('time')}
            </span>
            <div className="dt-picker-time-list">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={value.time === slot ? 'selected' : ''}
                  onClick={() => onChange({ ...value, time: slot })}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="dt-picker-confirm"
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
