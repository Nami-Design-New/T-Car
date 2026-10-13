'use client';

import { useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { Dialog } from '@/shared/ui/Dialog';
import { MapLocationModal, type LocationData } from '@/features/rental-search';
import type { BookingDetails } from '@/features/booking';
import { ICONS } from '@/shared/config/assets';
const deliveryCarIcon = ICONS.deliveryCar;

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

type MapField = 'pickup' | 'dropoff';

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'];
const VAT_RATE = 0.15;

function getMonthlyRange(months: number): DateRange {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  return { start, end };
}

function getAddressTitle(address: string, fallback: string) {
  return address.split(',')[0]?.trim() || fallback;
}

export default function BookingMonthlyModal({ open, onClose, pricePerDay, onConfirm }: Props) {
  const t = useTranslations('booking.daily');
  const tm = useTranslations('booking.monthly');
  const formatShort = (d: Date) => `${d.getDate()} ${t(`months.${MONTHS[d.getMonth()]}`)} ${d.getFullYear()}`;
  const distanceHint = tm.rich('distanceHint', { strong: (chunks) => <strong>{chunks}</strong> });

  const [rentalMonths, setRentalMonths] = useState(1);
  const [range, setRange] = useState<DateRange>(() => getMonthlyRange(1));
  const [time, setTime] = useState('9:00 AM');
  const [notes, setNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [mapField, setMapField] = useState<MapField | null>(null);

  const changeRentalMonths = (months: number) => {
    const nextMonths = Math.min(12, Math.max(1, months));
    setRentalMonths(nextMonths);
    setRange(getMonthlyRange(nextMonths));
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

  const monthProgress = (rentalMonths / 12) * 100;

  return (
    <Dialog open={open} onClose={onClose} size="xl" className="booking_dialog" label={tm('title')}>
      <div className="booking_modal">
        <div className="booking_modal_calendar">
          <div className="booking_monthly_picker" style={{ '--month-progress': `${monthProgress}%` } as CSSProperties}>
            <div className="booking_monthly_label">{tm('monthsCount')}</div>

            <div className="booking_monthly_stepper">
              <button
                type="button"
                className="booking_monthly_step"
                aria-label={tm('increase')}
                onClick={() => changeRentalMonths(rentalMonths + 1)}
                disabled={rentalMonths === 12}
              >
                +
              </button>

              <strong className="booking_monthly_count">{rentalMonths}</strong>

              <button
                type="button"
                className="booking_monthly_step"
                aria-label={tm('decrease')}
                onClick={() => changeRentalMonths(rentalMonths - 1)}
                disabled={rentalMonths === 1}
              >
                −
              </button>
            </div>

            <div className="booking_monthly_track">
              <span className="booking_monthly_fill" />
              <span className="booking_monthly_value">
                {tm('months', { count: rentalMonths })}
              </span>
              <span className="booking_monthly_thumb">
                <span>▶</span>
                <span className="booking_monthly_knob" />
                <span>◀</span>
              </span>
              <input
                type="range"
                className="booking_monthly_range"
                min="0"
                max="12"
                step="1"
                value={rentalMonths}
                aria-label={tm('sliderLabel')}
                onChange={(e) => changeRentalMonths(Number(e.target.value))}
              />
            </div>

            <div className="booking_monthly_dates">
              {formatShort(range.start!)} <strong>{t('to')}</strong> {formatShort(range.end!)}
            </div>
          </div>
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
          <p>{distanceHint}</p>
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
          <p>{distanceHint}</p>
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
