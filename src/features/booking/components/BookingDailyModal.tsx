'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FiChevronRight, FiChevronLeft, FiClock, FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import type { BookingDetails } from '../model';
import { bookingDetailsSchema, TIME_SLOTS, type BookingDetailsFormValues } from '../validation';
import { ICONS } from '@/shared/config/assets';
const deliveryCarIcon = ICONS.deliveryCar;
import { MapLocationModal } from '@/shared/ui/MapLocationModal';
import type { LocationData } from '@/shared/lib/location';

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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const VAT_RATE = 0.15;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function getAddressTitle(address: string, fallback: string) {
  return address.split(',')[0]?.trim() || fallback;
}

export default function BookingDailyModal({
  open,
  onClose,
  pricePerDay,
  onConfirm,
  initialDetails = null,
  mode = 'create',
}: Props) {
  const t = useTranslations('booking.daily');
  const [cursor, setCursor] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [mapField, setMapField] = useState<MapField | null>(null);
  const fieldError = useFieldErrorMessage();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingDetailsFormValues, unknown, BookingDetails>({
    resolver: zodResolver(bookingDetailsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      startDate: null,
      endDate: null,
      time: '9:00 AM',
      days: 1,
      pricePerDay,
      subtotal: 0,
      vat: 0,
      total: 0,
      notes: '',
      pickupAddress: '',
      dropoffAddress: '',
      pickupLocation: null,
      dropoffLocation: null,
    },
  });
  const time = watch('time');
  const notes = watch('notes');
  const pickupAddress = watch('pickupAddress') ?? '';
  const dropoffAddress = watch('dropoffAddress') ?? '';
  const pickupLocation = watch('pickupLocation') ?? null;
  const dropoffLocation = watch('dropoffLocation') ?? null;
  const pickupAddressField = register('pickupAddress');
  const dropoffAddressField = register('dropoffAddress');
  const notesField = register('notes');

  // Prefill when opened in edit mode or when initialDetails provided.
  useEffect(() => {
    if (!open) return;

    if (initialDetails) {
      const start = new Date(initialDetails.startDate);
      const end = new Date(initialDetails.endDate);
      setCursor(start);
      setRange({ start, end });
      reset({
        ...initialDetails,
        startDate: start,
        endDate: end,
        time: TIME_SLOTS.includes(initialDetails.time as (typeof TIME_SLOTS)[number])
          ? (initialDetails.time as (typeof TIME_SLOTS)[number])
          : '9:00 AM',
        pricePerDay,
      });
      return;
    }

    reset({
      startDate: null,
      endDate: null,
      time: '9:00 AM',
      days: 1,
      pricePerDay,
      subtotal: 0,
      vat: 0,
      total: 0,
      notes: '',
      pickupAddress: '',
      dropoffAddress: '',
      pickupLocation: null,
      dropoffLocation: null,
    });
    setRange({ start: null, end: null });
  }, [open, initialDetails, pricePerDay, reset]);

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
      setValue('startDate', day, { shouldValidate: true });
      setValue('endDate', null, { shouldValidate: true });
      return;
    }

    const nextRange =
      day < range.start
        ? { start: day, end: range.start }
        : { start: range.start, end: day };
    setRange(nextRange);
    setValue('startDate', nextRange.start, { shouldValidate: true });
    setValue('endDate', nextRange.end, { shouldValidate: true });
  };

  const totalDays =
    range.start && range.end
      ? Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000))
      : 1;
  const subtotal = pricePerDay * totalDays;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  const handleLocationConfirm = (location: LocationData) => {
    const address = location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
    const selectedLocation = { ...location, address };

    if (mapField === 'pickup') {
      setValue('pickupAddress', address, { shouldValidate: true });
      setValue('pickupLocation', selectedLocation, { shouldValidate: true });
    } else if (mapField === 'dropoff') {
      setValue('dropoffAddress', address, { shouldValidate: true });
      setValue('dropoffLocation', selectedLocation, { shouldValidate: true });
    }

    setMapField(null);
  };

  const submit = handleSubmit((details) => {
    onConfirm({
      ...details,
      days: totalDays,
      pricePerDay,
      subtotal,
      vat,
      total,
    });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      className="booking_dialog"
      label={mode === 'edit' ? t('editBooking') : t('newBooking')}
    >
      <Dialog.Header className="booking_dialog_header">
        <Dialog.Title>{mode === 'edit' ? t('editBooking') : t('newBooking')}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <form className="booking_modal" onSubmit={submit} noValidate>
        <div className="booking_modal_calendar">
          <div className="calendar_header">
            <button
              type="button"
              aria-label={t('previousMonth')}
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <FiChevronLeft className="mirror-in-rtl" aria-hidden="true" />
            </button>

            <span>
              {t(`months.${MONTHS[month]}`)} {year}
            </span>

            <button
              type="button"
              aria-label={t('nextMonth')}
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <FiChevronRight className="mirror-in-rtl" aria-hidden="true" />
            </button>
          </div>

          <div className="calendar_weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{t(`weekdays.${day}`)}</span>
            ))}
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
          {(errors.startDate || errors.endDate) && (
            <p className="form_error" role="alert">
              {fieldError(errors.startDate?.message ?? errors.endDate?.message)}
            </p>
          )}
        </div>

        <div className="booking_field">
          <label>{t('pickupDropoffTime')}</label>
          <div className="time_select">
            <FiClock />
            <select {...register('time')} value={time}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          {errors.time && (
            <p className="form_error" role="alert">
              {fieldError(errors.time.message)}
            </p>
          )}
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
              {...pickupAddressField}
              id="pickup-address"
              type="text"
              placeholder={t('enterAddress')}
              value={pickupAddress}
              aria-invalid={Boolean(errors.pickupAddress)}
              aria-describedby={errors.pickupAddress ? 'pickup-address-error' : undefined}
              onChange={(event) => {
                setValue('pickupAddress', event.target.value, { shouldValidate: true });
                setValue('pickupLocation', null, { shouldValidate: true });
              }}
            />
          )}
          <p>{t('distanceHint')}</p>
          {errors.pickupAddress && (
            <p id="pickup-address-error" className="form_error" role="alert">
              {fieldError(errors.pickupAddress.message)}
            </p>
          )}
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
              {...dropoffAddressField}
              id="dropoff-address"
              type="text"
              placeholder={t('enterAddress')}
              value={dropoffAddress}
              aria-invalid={Boolean(errors.dropoffAddress)}
              aria-describedby={errors.dropoffAddress ? 'dropoff-address-error' : undefined}
              onChange={(event) => {
                setValue('dropoffAddress', event.target.value, { shouldValidate: true });
                setValue('dropoffLocation', null, { shouldValidate: true });
              }}
            />
          )}
          <p>{t('distanceHint')}</p>
          {errors.dropoffAddress && (
            <p id="dropoff-address-error" className="form_error" role="alert">
              {fieldError(errors.dropoffAddress.message)}
            </p>
          )}
        </div>

        <div className="booking_field">
          <label>{t('additionalDetails')}</label>
          <textarea
            {...notesField}
            rows={4}
            placeholder={t('notesPlaceholder')}
            value={notes}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? 'booking-notes-error' : undefined}
            onChange={(event) =>
              setValue('notes', event.target.value, { shouldValidate: true, shouldDirty: true })
            }
          />
          {errors.notes && (
            <p id="booking-notes-error" className="form_error" role="alert">
              {fieldError(errors.notes.message)}
            </p>
          )}
        </div>

        <div className="booking_modal_footer">
          <Button
            type="submit"
            className="confirm_booking_btn"
            disabled={!range.start || !range.end}
          >
            {mode === 'edit' ? t('submitEdit') : t('continue')}
          </Button>

          <div className="booking_total">
            <span>{t('total')}</span>
            <h3>{formatCurrency(total)}</h3>
          </div>
        </div>
      </form>

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
