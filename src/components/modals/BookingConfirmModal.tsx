'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiStar } from 'react-icons/fi';
import { formatCurrency } from '@utils/index';
import type { BookingDetails } from '@app-types/car';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
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
  onContinue,
  carName,
  carBrand,
  carImage,
  showroom,
  rating,
  booking,
}: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);
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
              <span className="label">عنوان الاستلام</span>
              <span className="value">{booking.pickupAddress || showroom}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">عنوان التسليم</span>
              <span className="value">{booking.dropoffAddress || showroom}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">موعد الاستلام</span>
              <span className="value">{formatFull(booking.startDate, booking.time)}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">موعد التسليم</span>
              <span className="value">{formatFull(booking.endDate, booking.time)}</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">تفاصيل التأمين</span>
              <span className="value">تأمين السيارة تكون جاهزة قبل الموعد</span>
            </div>

            <div className="confirm_date_row">
              <span className="label">وقت الطلب</span>
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
            <h3>الشروط والأحكام</h3>

            <ul>
              <li>لدي رخصة قيادة سارية.</li>
              <li>لدي هوية وطنية سارية / إقامة.</li>
              <li>قد يتطلب بعض مواقف التأجير أو الدفع مقدماً مبلغاً قابلاً للاسترداد.</li>
              <li>أوافق على جميع الشروط والأحكام.</li>
            </ul>

            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />{' '}
              أوافق على جميع هذه المتطلبات، أنا مؤهل للحجز.
            </label>
          </div>
        </div>

        <div className="confirm_modal_footer">
          <button type="button" className="back_link_btn" onClick={onBack}>
            رجوع لتعديل التاريخ
          </button>

          <button type="button" className="pay_btn" onClick={onContinue}>
            متابعة للدفع
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
