'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { FiStar, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '@/shared/lib/format';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { FormCheckbox } from '@/shared/ui/Form';
import { useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { BookingDetails } from '../model';
import { bookingTermsSchema, type BookingTermsValues } from '../validation';
import Image from 'next/image';

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
  carName: string;
  carBrand: string;
  carImage: string;
  showroom: string;
  rating: number;
  booking: BookingDetails;
}

export default function BookingConfirmModal({
  open,
  onClose,
  onBack,
  onContinue,
  carName,
  carBrand,
  carImage,
  showroom,
  rating,
  booking,
}: Props) {
  const t = useTranslations('booking.confirm');
  const fieldError = useFieldErrorMessage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingTermsValues>({
    resolver: zodResolver(bookingTermsSchema),
    mode: 'onSubmit',
  });
  const submit = handleSubmit(() => onContinue());
  const formatFull = (date: Date, time: string) => `${date.toLocaleDateString()} - ${time}`;
  return (
    <Dialog open={open} onClose={onClose} size="xl" label={t('dialogLabel')}>
      <div className="confirm_modal confirm_booking_modal">
        <div className="confirm_modal_header">
          <button type="button" className="back_btn" onClick={onBack} aria-label={t('back')}>
            <FiArrowLeft className="mirror-in-rtl" />
          </button>
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Close className="close_btn" />
        </div>

        <form onSubmit={submit} noValidate>
        <div className="confirm_modal_scroll">
          <div className="confirm_car_summary">
            <div className="confirm_car_summary_image">
              <Image src={carImage} alt={carName} fill sizes="70px" />
            </div>

            <div className="confirm_car_summary_body">
              <h4>
                {carBrand} {carName}
              </h4>
              <span className="showroom">
                <FiStar /> {showroom}
              </span>
            </div>

            <div className="confirm_car_summary_price">
              <span className="old">{formatCurrency(booking.pricePerDay + 100)}</span>
              <span className="current">
                {formatCurrency(booking.pricePerDay)}
                {t('perDay')}
              </span>
            </div>
          </div>

          <div className="confirm_dates">
            <div className="confirm_date_row">
              <span className="label">{t('pickupAddress')}</span>
              <span className="value">{booking.pickupAddress || showroom}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">{t('dropoffAddress')}</span>
              <span className="value">{booking.dropoffAddress || showroom}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">{t('pickupTime')}</span>
              <span className="value">{formatFull(booking.startDate, booking.time)}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">{t('dropoffTime')}</span>
              <span className="value">{formatFull(booking.endDate, booking.time)}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">{t('insurance')}</span>
              <span className="value">{t('insuranceValue')}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">{t('orderTime')}</span>
              <span className="value">
                {new Date().toLocaleString('ar-SA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="confirm_section">
            <h3>{t('priceDetails')}</h3>

            <div className="price_breakdown">
              <div className="price_item">
                <span>{t('dailyPrice')}</span>
                <strong>{formatCurrency(booking.pricePerDay)}</strong>
              </div>

              <div className="price_item">
                <span>{t('days')}</span>
                <strong>
                  {booking.days} {t('day')}
                </strong>
              </div>

              <div className="price_item">
                <span>{t('subtotal')}</span>
                <strong>{formatCurrency(booking.subtotal)}</strong>
              </div>

              <div className="price_item">
                <span>{t('tax')}</span>
                <strong>{formatCurrency(booking.vat)}</strong>
              </div>

              <div className="price_total">
                <span>{t('total')}</span>
                <h3>{formatCurrency(booking.total)}</h3>
              </div>
            </div>
          </div>

          <div className="confirm_section">
            <h3>{t('termsTitle')}</h3>

            <ul>
              <li>{t('terms.license')}</li>
              <li>{t('terms.identity')}</li>
              <li>{t('terms.refundable')}</li>
              <li>{t('terms.agree')}</li>
            </ul>

            <FormCheckbox
              id="booking-terms"
              label={t('eligibility')}
              required
              error={fieldError(errors.termsAccepted?.message)}
              {...register('termsAccepted')}
            />
          </div>
        </div>

        <div className="confirm_modal_footer">
          <Button type="submit" className="pay_btn">
            {t('continuePayment')}
          </Button>
        </div>
        </form>
      </div>
    </Dialog>
  );
}
