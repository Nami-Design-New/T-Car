'use client';

import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { ResultDialog } from '@/shared/ui/ResultDialog';

import BookingConfirmModal from './BookingConfirmModal';
import Image from 'next/image';
import RiyalIcon from '@/assets/icons/sar.svg';
import type { BookingDetails, PaymentMethod } from '../model';

import type { StaticImageData } from 'next/image';
import BookingDailyModal from './BookingDailyModal';
import PaymentMethodModal from './PaymentMethodModal';
import { useCreateBooking } from '../hooks/useCreateBooking';

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
            <Image src={RiyalIcon} alt="ريال" width={18} height={18} className="riyal-icon" />
          </h2>

          <small>/ يوم</small>
        </div>
      </div>

      <button type="button" className="car-booking-card-btn" onClick={() => setStep('dates')}>
        احجز الآن
      </button>

      <p className="car-booking-card-note">لن يتم خصم أي مبلغ الآن، الدفع عند الاستلام</p>

      <BookingDailyModal
        open={step === 'dates'}

        onClose={() => setStep('closed')}
        pricePerDay={pricePerDay}
        onConfirm={handleDatesConfirmed}
      />

      {booking && (
        <BookingConfirmModal
          open={step === 'confirm'}
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

      <PaymentMethodModal
        open={step === 'payment'}
        onClose={() => {
          if (!submitting) setStep('closed');
        }}
        onConfirm={handlePay}
        loading={submitting}
        error={flow.step === 'payment' && flow.error ? errorMessage(flow.error) : undefined}
      />

      <SuccessModal
        open={step === 'success'}
        title="تم تأكيد الحجز بنجاح!"
        description="جاري تحويلك إلى صفحة حجوزاتي..."
        buttonText="الانتقال الآن"
        redirectTo="/account/bookings"
        autoRedirect
      />
    </aside>
  );
}
