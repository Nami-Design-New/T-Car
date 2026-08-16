'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiStar, FiCalendar, FiMapPin, FiDroplet } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { BookingDetails, CarListing, PaymentMethod } from '@app-types/car';
import Button from '../common/Button';
import BookingMonthlyModal from '../modals/BookingMonthlyModal';
import BookingDailyModal from '../modals/BookingDailyModal';
import BookingConfirmModal from '../modals/BookingConfirmModal';
import PaymentMethodModal from '../modals/PaymentMethodModal';
import SuccessModal from '../common/SuccessModal';

interface Props {
  car: CarListing;
}

export default function CityCarCard({ car }: Props) {
  const [bookingType, setBookingType] = useState<'monthly' | 'daily' | null>(null);
  const [step, setStep] = useState<'closed' | 'dates' | 'confirm' | 'payment' | 'success'>(
    'closed'
  );
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const handleBookNow = () => {
    const type = new URLSearchParams(window.location.search).get('type');
    setBookingType(type === 'monthly' ? 'monthly' : 'daily');
    setStep('dates');
  };

  const closeBooking = () => {
    setStep('closed');
    setBookingType(null);
    setBooking(null);
  };

  const handleDatesConfirmed = (details: BookingDetails) => {
    setBooking(details);
    setStep('confirm');
  };

  const handlePay = (method: PaymentMethod) => {
    console.log(car.id, booking, method);
    setStep('success');
  };

  return (
    <>
      <div className="city-car-card">
        {car.originalPrice && <span className="discount_badge">خصم خاص</span>}

        <Link href={`/cars/${car.id}`} className="city-car-card-image">
          <Image src={car.image} alt={car.name} fill sizes="350px" />
        </Link>

        <div className="city-car-card-content">
          <div className="title_row">
            <h3>
              {car.brand} {car.name}
            </h3>
            <div className="rate">
              <FiStar />
              {car.rating}
            </div>
          </div>

          <div className="car_meta">
            <span>
              <FiCalendar />
              {car.year}
            </span>
            {/* <span><FiDroplet />{car.fuelType}</span> */}
            <span>
              <FiMapPin />
              {car.showroom}
            </span>
          </div>

          <div className="price_row">
            <div>
              {car.originalPrice && (
                <span className="old_price">{formatCurrency(car.originalPrice)}</span>
              )}
              <h2>{formatCurrency(car.pricePerDay)}</h2>
              <small> / يوم</small>
            </div>

            <Button onClick={handleBookNow} className="book_now_btn">
              احجز الآن
            </Button>
          </div>
        </div>
      </div>

      {bookingType === 'monthly' && step === 'dates' && (
        <BookingMonthlyModal
          open
          onClose={closeBooking}
          pricePerDay={car.pricePerDay}
          onConfirm={handleDatesConfirmed}
        />
      )}

      {bookingType === 'daily' && step === 'dates' && (
        <BookingDailyModal
          open
          onClose={closeBooking}
          pricePerDay={car.pricePerDay}
          onConfirm={handleDatesConfirmed}
        />
      )}

      {booking && step === 'confirm' && (
        <BookingConfirmModal
          open
          onClose={closeBooking}
          onBack={() => setStep('dates')}
          onContinue={() => setStep('payment')}
          carName={car.name}
          carBrand={car.brand}
          carImage={car.image}
          showroom={car.showroom}
          rating={car.rating}
          booking={booking}
        />
      )}

      <PaymentMethodModal open={step === 'payment'} onClose={closeBooking} onConfirm={handlePay} />

      <SuccessModal
        open={step === 'success'}
        title="تم تأكيد الحجز بنجاح!"
        description="جاري تحويلك إلى صفحة حجوزاتي..."
        buttonText="الانتقال الآن"
        redirectTo="/account"
        autoRedirect
        onDone={closeBooking}
      />
    </>
  );
}
