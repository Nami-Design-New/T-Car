'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiChevronRight, FiChevronLeft, FiClock } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { Dialog } from '@/shared/ui/Dialog';
import type { BookingDetails } from '@/features/booking';

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

// Sunday-first, matching Date#getDay() (0 = Sunday) used by startOffset below.
// Column order is then handled by the inherited `dir`, not by reversing this
// array -- reversing it silently mislabels every column.
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'];

const VAT_RATE = 0.15;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function BookingModal({ open, onClose, pricePerDay, onConfirm }: Props) {
  const t = useTranslations('booking.daily');
  const formatShort = (d: Date) => `${d.getDate()} ${t(`months.${MONTHS[d.getMonth()]}`)} ${d.getFullYear()}`;

  const [cursor, setCursor] = useState(new Date());

  const [range, setRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  const [time, setTime] = useState('9:00 AM');
  const [notes, setNotes] = useState('');

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

  return (
    <Dialog open={open} onClose={onClose} size="xl" label={t('newBooking')}>
      <div className="booking_modal">
        <div className="booking_modal_calendar">
          <div className="calendar_header">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              <FiChevronRight />
            </button>

            <span>
              {t(`months.${MONTHS[month]}`)} {year}
            </span>

            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              <FiChevronLeft />
            </button>
          </div>

          <div className="calendar_weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{t(`weekdays.${day}`)}</span>
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
                ? `${formatShort(range.start)} ${t('to')} ${formatShort(range.end)}`
                : `${formatShort(range.start)} — ${t('chooseEndDate')}`}
            </div>
          )}
        </div>

        <div className="booking_field">
          <label>{t('pickupTime')}</label>

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
          <label>{t('additionalDetails')}</label>

          <textarea
            rows={4}
            placeholder={t('notesPlaceholder')}
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
            {t('continue')}
          </button>

          <div className="booking_total">
            <span>{t('total')}</span>
            <h3>{formatCurrency(total)}</h3>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
