'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FiChevronRight, FiChevronLeft, FiClock, FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { Dialog } from '@/shared/ui/Dialog';
import type { BookingDetails } from '../model';
import deliveryCarIcon from '@assets/icons/delivery-car.svg';
import { MapLocationModal, type LocationData } from '@/features/rental-search';

interface Props {
  open: boolean;
  onClose: () => void;
  pricePerDay: number;
  onConfirm: (details: BookingDetails) => void;
  initialDetails?: BookingDetails | null;
  mode?: 'create' | 'edit';
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

type MapField = 'pickup' | 'dropoff';

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

function getAddressTitle(address: string, fallback: string) {
  return address.split(',')[0]?.trim() || fallback;
}

export default function BookingDailyModal({ open, onClose, pricePerDay, onConfirm, initialDetails = null, mode = 'create' }: Props) {
  const t = useTranslations('booking.daily');
  const [cursor, setCursor] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [time, setTime] = useState('9:00 AM');
  const [notes, setNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [mapField, setMapField] = useState<MapField | null>(null);
  // Prefill when opened in edit mode or when initialDetails provided
  useEffect(() => {
    if (!open) return;

    if (initialDetails) {
      try {
        const start = initialDetails.startDate ? new Date(initialDetails.startDate) : new Date();
        const end = initialDetails.endDate ? new Date(initialDetails.endDate) : null;

        setCursor(start);
        setRange({ start, end });

        if (initialDetails.time) setTime(initialDetails.time);
        if (initialDetails.notes) setNotes(initialDetails.notes || '');
        if (initialDetails.pickupAddress) setPickupAddress(initialDetails.pickupAddress || '');
        if (initialDetails.dropoffAddress) setDropoffAddress(initialDetails.dropoffAddress || '');
        if (initialDetails.pickupLocation) setPickupLocation(initialDetails.pickupLocation || null);
        if (initialDetails.dropoffLocation) setDropoffLocation(initialDetails.dropoffLocation || null);
      } catch (e) {
      }
    }
  }, [open, initialDetails]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (mapField) setMapField(null);
      else onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mapField, onClose, open]);

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
    if (!range.start || range.end) {
      setRange({ start: day, end: null });
      return;
    }

    if (day < range.start) {
      setRange({ start: day, end: range.start });
    } else {
      setRange({ start: range.start, end: day });
    }
  };

  const totalDays = range.start && range.end
    ? Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000))
    : 1;
  const subtotal = pricePerDay * totalDays;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  const handleLocationConfirm = (location: LocationData) => {
    const address = location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
    const selectedLocation = { ...location, address };

    if (mapField === 'pickup') {
      setPickupAddress(address);
      setPickupLocation(selectedLocation);
    } else if (mapField === 'dropoff') {
      setDropoffAddress(address);
      setDropoffLocation(selectedLocation);
    }

    setMapField(null);
  };

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
      pickupAddress,
      dropoffAddress,
      pickupLocation,
      dropoffLocation,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} size="xl" label={mode === 'edit' ? t('editBooking') : t('newBooking')}>
      <div className="booking_modal">
        <div className="booking_modal_calendar">
          <div className="calendar_header">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              <FiChevronRight />
            </button>

            <span>{t(`months.${MONTHS[month]}`)} {year}</span>

            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              <FiChevronLeft />
            </button>
          </div>

          <div className="calendar_weekdays">
            {WEEKDAYS.map((day) => <span key={day}>{t(`weekdays.${day}`)}</span>)}
          </div>

          <div className="calendar_days">
            {cells.map((day, i) => {
              if (!day) return <span key={i} className="cell empty" />;

              const disabled = day < today;
              const isStart = range.start && sameDay(day, range.start);
              const isEnd = range.end && sameDay(day, range.end);
              const inRange = range.start && range.end && day > range.start && day < range.end;

              return (
                <span
                  key={i}
                  className={`cell ${inRange ? 'in-range' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''}`}
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
                ? `${range.start.toLocaleDateString()} ${t('to')} ${range.end.toLocaleDateString()}`
                : `${range.start.toLocaleDateString()} — ${t('chooseEndDate')}`}
            </div>
          )}
        </div>

        <div className="booking_field">
          <label>{t('pickupDropoffTime')}</label>
          <div className="time_select">
            <FiClock />
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
        </div>

        <div className="booking_field booking_location_field">
          <div className="booking_location_label">
            <label htmlFor="pickup-address">{t('pickupAddress')}</label>
            <button type="button" onClick={() => setMapField('pickup')}>
              <FiMapPin />
              {t('chooseFromMap')}
            </button>
          </div>
          {pickupLocation ? (
            <button
              type="button"
              className="booking_daily_address_card"
              onClick={() => setMapField('pickup')}
              aria-label={t('changePickup')}
            >
              <span className="booking_daily_address_icon">
                <Image src={deliveryCarIcon} alt="" width={24} height={24} />
              </span>
              <span className="booking_daily_address_content">
                <strong>{getAddressTitle(pickupAddress, t('pickupLocation'))}</strong>
                <small>{pickupAddress}</small>
              </span>
              <span className="booking_daily_address_distance">{t('selected')}</span>
            </button>
          ) : (
            <input
              id="pickup-address"
              type="text"
              placeholder={t('enterAddress')}
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                setPickupLocation(null);
              }}
            />
          )}
          <p>{t('distanceHint')}</p>
        </div>

        <div className="booking_field booking_location_field">
          <div className="booking_location_label">
            <label htmlFor="dropoff-address">{t('dropoffAddress')}</label>
            <button type="button" onClick={() => setMapField('dropoff')}>
              <FiMapPin />
              {t('chooseFromMap')}
            </button>
          </div>
          {dropoffLocation ? (
            <button
              type="button"
              className="booking_daily_address_card"
              onClick={() => setMapField('dropoff')}
              aria-label={t('changeDropoff')}
            >
              <span className="booking_daily_address_icon">
                <Image src={deliveryCarIcon} alt="" width={24} height={24} />
              </span>
              <span className="booking_daily_address_content">
                <strong>{getAddressTitle(dropoffAddress, t('dropoffLocation'))}</strong>
                <small>{dropoffAddress}</small>
              </span>
              <span className="booking_daily_address_distance">{t('selected')}</span>
            </button>
          ) : (
            <input
              id="dropoff-address"
              type="text"
              placeholder={t('enterAddress')}
              value={dropoffAddress}
              onChange={(e) => {
                setDropoffAddress(e.target.value);
                setDropoffLocation(null);
              }}
            />
          )}
          <p>{t('distanceHint')}</p>
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
            {mode === 'edit' ? t('submitEdit') : t('continue')}
          </button>

          <div className="booking_total">
            <span>{t('total')}</span>
            <h3>{formatCurrency(total)}</h3>
          </div>
        </div>

      </div>

      {mapField !== null && (
        <MapLocationModal
          open
          onClose={() => setMapField(null)}
          onConfirm={handleLocationConfirm}
          title={mapField === 'dropoff' ? t('selectDropoff') : t('selectPickup')}
          initialLocation={mapField === 'dropoff' ? dropoffLocation : pickupLocation}
        />
      )}
    </Dialog>
  );
}
