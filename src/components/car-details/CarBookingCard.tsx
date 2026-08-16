'use client';

import { useState } from 'react';
import { formatCurrency } from '@utils/index';

import BookingConfirmModal from '../modals/BookingConfirmModal';
import SuccessModal from '../common/SuccessModal';
import Image from 'next/image';
import RiyalIcon from '@/assets/icons/sar.svg';
import type { BookingDetails, PaymentMethod } from '@app-types/car';

import type { StaticImageData } from 'next/image';
import BookingDailyModal from '../modals/BookingDailyModal';
import PaymentMethodModal from '../modals/PaymentMethodModal';

type Step = 'closed' | 'dates' | 'confirm' | 'payment' | 'success';

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

  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const handleDatesConfirmed = (details: BookingDetails) => {
    setBooking(details);
    setStep('confirm');
  };

  const handlePay = (method: PaymentMethod) => {
    console.log(carId, booking, method);

    setStep('success');
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
        onClose={() => setStep('closed')}
        onConfirm={handlePay}
      />

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
