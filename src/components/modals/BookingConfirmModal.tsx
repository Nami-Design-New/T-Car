'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiStar } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { BookingDetails, PaymentMethod } from '@app-types/car';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';

import walletIcon from '@assets/icons/Wallet.svg';
import visaIcon from '@assets/icons/Payment.svg';
interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onPay: (method: PaymentMethod) => void;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  rating: number;
  booking: BookingDetails;
}

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

function formatFull(d: Date, time: string) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} - ${time}`;
}

export default function BookingConfirmModal({
  open,
  onClose,
  onBack,
  onPay,
  carName,
  carBrand,
  carImage,
  showroom,
  rating,
  booking,
}: Props) {
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const content = (
    <div className="modal_overlay" onClick={onClose}>
      <div className="confirm_modal" onClick={(e) => e.stopPropagation()}>
        <button className="close_btn" onClick={onClose} aria-label="إغلاق">
          <FiX />
        </button>

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
              <span className="current">{formatCurrency(booking.pricePerDay)}/يوم</span>
            </div>
          </div>

          <div className="confirm_dates">
            <div className="confirm_date_row">
              <span className="label">موعد الاستلام</span>
              <span className="value">{formatFull(booking.startDate, booking.time)}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">موعد التسليم</span>
              <span className="value">{formatFull(booking.endDate, booking.time)}</span>
            </div>
          </div>

          <div className="confirm_section">
            <h3>تفاصيل السعر</h3>

            <div className="price_breakdown">
              <div className="price_item">
                <span>السعر اليومي</span>
                <strong>{formatCurrency(booking.pricePerDay)}</strong>
              </div>

              <div className="price_item">
                <span>عدد الأيام</span>
                <strong>{booking.days} يوم</strong>
              </div>

              <div className="price_item">
                <span>المجموع الفرعي</span>
                <strong>{formatCurrency(booking.subtotal)}</strong>
              </div>

              <div className="price_item">
                <span>الضريبة</span>
                <strong>{formatCurrency(booking.vat)}</strong>
              </div>

              <div className="price_total">
                <span>الإجمالي</span>
                <h3>{formatCurrency(booking.total)}</h3>
              </div>
            </div>
          </div>

          <div className="confirm_section">
            <h3>طريقة الدفع</h3>

            <div className="payment_methods">
              <label className={`payment_method ${method === 'wallet' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'wallet'}
                  onChange={() => setMethod('wallet')}
                />

                <Image
                  src={walletIcon}
                  alt="Wallet"
                  width={26}
                  height={26}
                  className="payment_icon"
                />

                <span>المحفظة</span>
              </label>

              <label className={`payment_method ${method === 'visa' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'visa'}
                  onChange={() => setMethod('visa')}
                />

                <Image src={visaIcon} alt="Visa" width={30} height={20} className="payment_icon" />

                <span>بطاقة ائتمان / فيزا</span>
              </label>
            </div>
          </div>
        </div>

        <div className="confirm_modal_footer">
          <button type="button" className="back_link_btn" onClick={onBack}>
            رجوع لتعديل التاريخ
          </button>

          <button type="button" className="pay_btn" onClick={() => onPay(method)}>
            الدفع والحجز
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
