'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronRight, FiChevronLeft, FiClock } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { BookingDetails } from '@app-types/car';

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (details: BookingDetails) => void;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const WEEKDAYS = ['الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الاثنين', 'الأحد', 'السبت'];

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'];

const VAT_RATE = 0.15;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function BookingModal({ open, onClose, pricePerDay, onConfirm }: Props) {
  const [cursor, setCursor] = useState(new Date());

  const [range, setRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  const [time, setTime] = useState('9:00 AM');
  const [notes, setNotes] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePick = (day: Date) => {
    if (!range.start || (range.start && range.end)) {
      setRange({
        start: day,
        end: null,
      });
      return;
    }

    if (day < range.start) {
      setRange({
        start: day,
        end: range.start,
      });
    } else {
      setRange({
        start: range.start,
        end: day,
      });
    }
  };

  const totalDays =
    range.start && range.end
      ? Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000))
      : 1;

  const subtotal = pricePerDay * totalDays;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

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

  const content = (
    <div className="modal_overlay" onClick={onClose}>
      <div className="booking_modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking_modal_calendar">
          <div className="calendar_header">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              <FiChevronRight />
            </button>

            <span>
              {MONTHS[month]} {year}
            </span>

            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              <FiChevronLeft />
            </button>
          </div>

          <div className="calendar_weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar_days">
            {cells.map((day, i) => {
              if (!day) {
                return <span key={i} className="cell empty" />;
              }

              const disabled = day < today;

              const isStart = range.start && sameDay(day, range.start);

              const isEnd = range.end && sameDay(day, range.end);

              const inRange = range.start && range.end && day > range.start && day < range.end;

              return (
                <span
                  key={i}
                  className={`cell
                    ${inRange ? 'in-range' : ''}
                    ${isStart ? 'range-start' : ''}
                    ${isEnd ? 'range-end' : ''}
                  `}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    className={isStart || isEnd ? 'selected' : ''}
                    onClick={() => handlePick(day)}
                  >
                    {day.getDate()}
                  </button>
                </span>
              );
            })}
          </div>

          {range.start && (
            <div className="range_display">
              {range.end
                ? `${formatShort(range.start)} إلى ${formatShort(range.end)}`
                : `${formatShort(range.start)} — اختر تاريخ النهاية`}
            </div>
          )}
        </div>

        <div className="booking_field">
          <label>حدد وقت الاستلام</label>

          <div className="time_select">
            <FiClock />

            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="booking_field">
          <label>تفاصيل إضافية</label>

          <textarea
            rows={4}
            placeholder="اكتب أي ملاحظات أو طلبات خاصة..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="booking_modal_footer">
          <button
            type="button"
            className="confirm_booking_btn"
            disabled={!range.start || !range.end}
            onClick={handleConfirmClick}
          >
            متابعة الحجز
          </button>

          <div className="booking_total">
            <span>الإجمالي</span>
            <h3>{formatCurrency(total)}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
