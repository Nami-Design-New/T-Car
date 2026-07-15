'use client';

import { useState } from 'react';
import { formatCurrency } from '@utils/index';

import BookingModal from '../modals/BookingModal';
import BookingConfirmModal from '../modals/BookingConfirmModal';
import SuccessModal from '../common/SuccessModal';

import type {
  BookingDetails,
  PaymentMethod,
} from '@app-types/car';

import type { StaticImageData } from 'next/image';

type Step = 'closed' | 'dates' | 'confirm' | 'success';

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
  const [step, setStep] = useState<Step>('closed');

  const [booking, setBooking] =
    useState<BookingDetails | null>(null);

  const handleDatesConfirmed = (
    details: BookingDetails
  ) => {
    setBooking(details);
    setStep('confirm');
  };

  const handlePay = (
    method: PaymentMethod
  ) => {

    console.log(carId, booking, method);

    setStep('success');
  };

  return (
    <aside className="car-booking-card">

      <div className="car-booking-card-price">

        {originalPrice && (
          <span className="car-booking-card-old-price">
            {formatCurrency(originalPrice)}
          </span>
        )}

        <div className="car-booking-card-current">
          <h2>{formatCurrency(pricePerDay)}</h2>
          <small>/ يوم</small>
        </div>

      </div>

      <button
        type="button"
        className="car-booking-card-btn"
        onClick={() => setStep('dates')}
      >
        احجز الآن
      </button>

      <p className="car-booking-card-note">
        لن يتم خصم أي مبلغ الآن، الدفع عند الاستلام
      </p>


      <BookingModal
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
          onPay={handlePay}
          carName={carName}
          carBrand={carBrand}
          carImage={carImage}
          showroom={showroom}
          rating={rating}
          booking={booking}
        />
      )}

      <SuccessModal
        open={step === 'success'}
        title="تم تأكيد الحجز بنجاح!"
        description="جاري تحويلك إلى صفحة حجوزاتي..."
        buttonText="الانتقال الآن"
        redirectTo="/account"
        autoRedirect
      />

    </aside>
  );
}