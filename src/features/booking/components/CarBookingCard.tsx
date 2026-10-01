'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/shared/lib/format';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { ResultDialog } from '@/shared/ui/ResultDialog';

import Image from 'next/image';
import RiyalIcon from '@/assets/icons/sar.svg';
import type { BookingDetails, PaymentMethod } from '../model';

import type { StaticImageData } from 'next/image';
import { useCreateBooking } from '../hooks/useCreateBooking';

const BookingDailyModal = dynamic(() => import('./BookingDailyModal'), { ssr: false });
const BookingConfirmModal = dynamic(() => import('./BookingConfirmModal'), { ssr: false });
const PaymentMethodModal = dynamic(() => import('./PaymentMethodModal'), { ssr: false });

interface SuccessProps {
  open: boolean;
  title: string;
  description: string;
  buttonText: string;
  redirectTo: string;
  autoRedirect?: boolean;
}

function SuccessModal({ open, title, description, buttonText, redirectTo }: SuccessProps) {
  const handleRedirect = () => {
    window.location.assign(redirectTo);
  };

  return (
    <ResultDialog
      open={open}
      status="success"
      title={title}
      description={description}
      action={{ label: buttonText, onClick: handleRedirect }}
      autoCloseMs={3000}
      onClose={handleRedirect}
    />
  );
}

/** One sheet at a time. A failed booking keeps the payment sheet open with the error. */
type Flow =
  | { step: 'closed' }
  | { step: 'dates' }
  | { step: 'confirm' }
  | { step: 'payment'; error?: AppError }
  | { step: 'success' };

interface Props {
  carId: string;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  rating: number;
  pricePerDay: number;
  originalPrice?: number;
}

export default function CarBookingCard({
  carId,
  carName,
  carBrand,
  carImage,
  showroom,
  rating,
  pricePerDay,
  originalPrice,
}: Props) {
  const t = useTranslations('booking.card');
  const [flow, setFlow] = useState<Flow>({ step: 'closed' });
  const { step } = flow;
  const setStep = (next: 'closed' | 'dates' | 'confirm' | 'payment') => setFlow({ step: next });
  const { submitting, createBooking } = useCreateBooking(carId);
  const errorMessage = useErrorMessage();

  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const handleDatesConfirmed = (details: BookingDetails) => {
    setBooking(details);
    setStep('confirm');
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!booking || submitting) return;

    const result = await createBooking(booking, method);
    setFlow(result.ok ? { step: 'success' } : { step: 'payment', error: result.error });
  };

  return (
    <aside className="car-booking-card">
      <div className="car-booking-card-price">
        {originalPrice && (
          <span className="car-booking-card-old-price">{formatCurrency(originalPrice)}</span>
        )}

        <div className="car-booking-card-current">
          <h2>
            {pricePerDay}
            <Image src={RiyalIcon} alt={t('currency')} width={18} height={18} className="riyal-icon" />
          </h2>

          <small>{t('perDay')}</small>
        </div>
      </div>

      <button type="button" className="car-booking-card-btn" onClick={() => setStep('dates')}>
        {t('bookNow')}
      </button>

      <p className="car-booking-card-note">{t('paymentNote')}</p>

      {step === 'dates' && (
        <BookingDailyModal
          open
          onClose={() => setStep('closed')}
          pricePerDay={pricePerDay}
          onConfirm={handleDatesConfirmed}
        />
      )}

      {booking && step === 'confirm' && (
        <BookingConfirmModal
          open
          onClose={() => setStep('closed')}
          onBack={() => setStep('dates')}
          onContinue={() => setStep('payment')}
          carName={carName}
          carBrand={carBrand}
          carImage={carImage}
          showroom={showroom}
          rating={rating}
          booking={booking}
        />
      )}

      {step === 'payment' && (
        <PaymentMethodModal
          open
          onClose={() => {
            if (!submitting) setStep('closed');
          }}
          onConfirm={handlePay}
          loading={submitting}
          error={flow.step === 'payment' && flow.error ? errorMessage(flow.error) : undefined}
        />
      )}

      <SuccessModal
        open={step === 'success'}
        title={t('successTitle')}
        description={t('successDescription')}
        buttonText={t('goNow')}
        redirectTo="/account/bookings"
        autoRedirect
      />
    </aside>
  );
}
