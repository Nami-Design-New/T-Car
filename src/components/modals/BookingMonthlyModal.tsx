'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { BookingDetails, LocationData } from '@app-types/car';
import deliveryCarIcon from '@assets/icons/delivery-car.svg';
import MapLocationModal from './MapLocationModal';

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

function formatShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

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
  const [rentalMonths, setRentalMonths] = useState(1);
  const [range, setRange] = useState<DateRange>(() => getMonthlyRange(1));
  const [time, setTime] = useState('9:00 AM');
  const [notes, setNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [mapField, setMapField] = useState<MapField | null>(null);
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
      if (e.key !== 'Escape') return;
      if (mapField) setMapField(null);
      else onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mapField, onClose, open]);

  if (!open || !mounted) return null;

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

  const content = (
    <div className="modal_overlay" onClick={onClose}>
      <div className="booking_modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking_modal_calendar">
          <div dir="rtl" style={{ padding: '20px 22px', borderRadius: 14, background: '#eaf3ff', textAlign: 'center' }}>
            <div style={{ marginBottom: 8, color: '#101820', fontSize: 14 }}>عدد الشهور</div>

            <div style={{ display: 'flex', direction: 'rtl', alignItems: 'center', justifyContent: 'space-between', maxWidth: 225, margin: '0 auto 18px' }}>
              <button
                type="button"
                aria-label="زيادة عدد الشهور"
                onClick={() => changeRentalMonths(rentalMonths + 1)}
                disabled={rentalMonths === 12}
                style={{ width: 28, height: 28, border: 0, borderRadius: 6, background: '#fff', color: '#101820', fontSize: 22, lineHeight: 1, cursor: rentalMonths === 12 ? 'not-allowed' : 'pointer', opacity: rentalMonths === 12 ? 0.5 : 1 }}
              >
                +
              </button>

              <strong style={{ color: '#101820', fontSize: 32, lineHeight: 1 }}>{rentalMonths}</strong>

              <button
                type="button"
                aria-label="تقليل عدد الشهور"
                onClick={() => changeRentalMonths(rentalMonths - 1)}
                disabled={rentalMonths === 1}
                style={{ width: 28, height: 28, border: 0, borderRadius: 6, background: '#fff', color: '#101820', fontSize: 22, lineHeight: 1, cursor: rentalMonths === 1 ? 'not-allowed' : 'pointer', opacity: rentalMonths === 1 ? 0.5 : 1 }}
              >
                −
              </button>
            </div>

            <div style={{ position: 'relative', height: 60, marginBottom: 14, overflow: 'hidden', borderRadius: 13, background: '#a4a4a4', color: '#fff' }}>
              <span style={{ position: 'absolute', top: 0, right: 0, width: `${monthProgress}%`, height: '100%', borderRadius: 13, background: '#287ff0', transition: 'width 0.2s ease' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 14, pointerEvents: 'none' }}>
                {rentalMonths} {rentalMonths === 1 ? 'شهر' : 'شهور'}
              </span>
              <span style={{ position: 'absolute', right: `calc(${monthProgress}% - 28px)`, top: '50%', display: 'flex', alignItems: 'center', gap: 3, transform: 'translateY(-50%)', color: '#fff', fontSize: 15, transition: 'right 0.2s ease', pointerEvents: 'none' }}>
                <span>▶</span>
                <span style={{ width: 24, height: 24, border: '2px solid #fff', borderRadius: '50%', background: '#287ff0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.18)' }} />
                <span>◀</span>
              </span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={rentalMonths}
                aria-label="عدد شهور الحجز"
                onChange={(e) => changeRentalMonths(Number(e.target.value))}
                style={{ position: 'absolute', inset: 0, zIndex: 2, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer', direction: 'rtl' }}
              />
            </div>

            <div style={{ color: '#101820', fontSize: 13 }}>
              {formatShort(range.start!)} <strong>الى</strong> {formatShort(range.end!)}
            </div>
          </div>
        </div>

        <div className="booking_field">
          <label>حدد وقت الاستلام والتسليم</label>
          <div className="time_select">
            <FiClock />
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
        </div>

        <div className="booking_field booking_location_field">
          <div className="booking_location_label">
            <label htmlFor="pickup-address">عنوان الاستلام</label>
            <button type="button" onClick={() => setMapField('pickup')}>
              <FiMapPin />
              اختر من الخريطة
            </button>
          </div>
          {pickupLocation ? (
            <button
              type="button"
              className="booking_daily_address_card"
              onClick={() => setMapField('pickup')}
              aria-label="تغيير عنوان الاستلام"
            >
              <span className="booking_daily_address_icon">
                <Image src={deliveryCarIcon} alt="" width={24} height={24} />
              </span>
              <span className="booking_daily_address_content">
                <strong>{getAddressTitle(pickupAddress, 'موقع الاستلام')}</strong>
                <small>{pickupAddress}</small>
              </span>
              <span className="booking_daily_address_distance">تم التحديد</span>
            </button>
          ) : (
            <input
              id="pickup-address"
              type="text"
              placeholder="ادخل عنوانك"
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                setPickupLocation(null);
              }}
            />
          )}
          <p>يجب أن يكون الموقع في حدود <strong>20 كم</strong> من موقع المعرض</p>
        </div>

        <div className="booking_field booking_location_field">
          <div className="booking_location_label">
            <label htmlFor="dropoff-address">عنوان التسليم</label>
            <button type="button" onClick={() => setMapField('dropoff')}>
              <FiMapPin />
              اختر من الخريطة
            </button>
          </div>
          {dropoffLocation ? (
            <button
              type="button"
              className="booking_daily_address_card"
              onClick={() => setMapField('dropoff')}
              aria-label="تغيير عنوان التسليم"
            >
              <span className="booking_daily_address_icon">
                <Image src={deliveryCarIcon} alt="" width={24} height={24} />
              </span>
              <span className="booking_daily_address_content">
                <strong>{getAddressTitle(dropoffAddress, 'موقع التسليم')}</strong>
                <small>{dropoffAddress}</small>
              </span>
              <span className="booking_daily_address_distance">تم التحديد</span>
            </button>
          ) : (
            <input
              id="dropoff-address"
              type="text"
              placeholder="ادخل عنوانك"
              value={dropoffAddress}
              onChange={(e) => {
                setDropoffAddress(e.target.value);
                setDropoffLocation(null);
              }}
            />
          )}
          <p>يجب أن يكون الموقع في حدود <strong>20 كم</strong> من موقع المعرض</p>
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

      <MapLocationModal
        open={mapField !== null}
        onClose={() => setMapField(null)}
        onConfirm={handleLocationConfirm}
        title={mapField === 'dropoff' ? 'حدد موقع التسليم' : 'حدد موقع الاستلام'}
        initialLocation={mapField === 'dropoff' ? dropoffLocation : pickupLocation}
      />
    </div>
  );

  return createPortal(content, document.body);
}
