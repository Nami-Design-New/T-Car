'use client';

import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronRight, FiChevronLeft, FiClock } from 'react-icons/fi';

interface DateTimeValue {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

interface Props {
  label: string;
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  minDate?: string;
  placeholder: string;
}

const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // من 6 صباحًا لـ 12 منتصف الليل
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DateTimePicker({ label, value, onChange, minDate, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => (value.date ? new Date(value.date) : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = الأحد
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const min = minDate ? new Date(minDate) : null;
  min?.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const displayText = value.date
    ? `${new Date(value.date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}${value.time ? ' - ' + value.time : ''}`
    : placeholder;

  return (
    <div className="dt-picker" ref={ref}>
      <button type="button" className="dt-picker-trigger" onClick={() => setOpen((p) => !p)}>
        <span className="dt-picker-label">{label}</span>
        <span className="dt-picker-value">{displayText}</span>
      </button>

      {open && (
        <div className="dt-picker-popover">
          <div className="dt-picker-calendar-header">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="الشهر السابق">
              <FiChevronRight />
            </button>
            <span>{MONTHS[month]} {year}</span>
            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="الشهر التالي">
              <FiChevronLeft />
            </button>
          </div>

          <div className="dt-picker-weekdays">
            {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className="dt-picker-days">
            {cells.map((day, i) => {
              if (!day) return <span key={i} className="empty" />;
              const iso = toISODate(day);
              const disabled = min ? day < min : false;
              const selected = value.date === iso;
              const today = toISODate(new Date()) === iso;

              return (
                <button
                  key={i}
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
              <FiClock /> الوقت
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
            تم
          </button>
        </div>
      )}
    </div>
  );
}