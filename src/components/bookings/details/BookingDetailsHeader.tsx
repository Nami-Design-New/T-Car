'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiMoreVertical,
  FiEdit2,
  FiCalendar,
  FiX,
} from 'react-icons/fi';

import type {
  BookingStatus,
  BookingDetails,
} from '@app-types/car';

import ExtendDurationModal from '@/components/modals/ExtendDurationModal';
import EditDailyBookingModal from '@/components/modals/EditDailyBookingModal';
import SuccessModal from '@/components/common/SuccessModal';
import CancelBookingModal from '@/components/modals/CancelBookingModal';

interface Props {
  reference: string;
  statusLabel: string;
  status: BookingStatus;
}

export default function BookingDetailsHeader({
  reference,
  statusLabel,
  status,
}: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isActive =
    status === 'current' ||
    status === 'upcoming' ||
    status === 'late';


  const bookingDetails: BookingDetails = {
    startDate: new Date('2026-08-20'),
    endDate: new Date('2026-08-25'),

    time: '09:00',

    notes: 'أريد السيارة جاهزة عند الوصول',

    days: 5,

    pricePerDay: 500,

    subtotal: 2500,

    vat: 125,

    total: 2625,

    pickupAddress: 'الرياض، طريق الملك فهد',

    dropoffAddress: 'الرياض، طريق العليا',

    pickupLocation: null,

    dropoffLocation: null,
  };

  return (
    <div className="booking-details-header">

      {/* Back */}
      <Link
        href="/account?tab=bookings"
        className="back_link"
        aria-label="رجوع"
      >
        <FiArrowRight />
      </Link>

      {/* Title */}
      <div className="booking-details-header-title">
        <h1>تفاصيل الحجز</h1>

        <span className="reference">
          #{reference}
        </span>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="booking-actions">

          {/* Trigger */}
          <button
            type="button"
            className="booking-actions-trigger"
            onClick={() => setShowActions((prev) => !prev)}
            aria-label="إجراءات الحجز"
            aria-expanded={showActions}
          >
            <FiMoreVertical />
          </button>

          {/* Menu */}
          {showActions && (
            <div className="booking-actions-menu">

              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  setShowEditModal(true);
                }}
              >
                <FiEdit2 />

                <span>
                  طلب تعديل
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  setShowExtendModal(true);
                }}
              >
                <FiCalendar />

                <span>
                  تمديد المدة
                </span>
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => {
                  setShowActions(false);
                  setShowCancelModal(true);
                }}
              >
                <FiX />

                <span>
                  إلغاء
                </span>
              </button>

            </div>
          )}

        </div>
      )}

      {/* ==================== Extend Duration ==================== */}

      <ExtendDurationModal
        open={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onConfirm={(newDays) => {
          setShowExtendModal(false);

          console.log(
            'Extend by days:',
            newDays
          );
        }}
        currentDays={bookingDetails.days}
        pricePerDay={bookingDetails.pricePerDay}
      />

      {/* ==================== Edit Booking ==================== */}
      <EditDailyBookingModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        pricePerDay={bookingDetails.pricePerDay}
        initialDetails={bookingDetails}
        onSubmit={(details) => {
          console.log(
            'Edit booking request:',
            details
          );

          setShowEditModal(false);
          setShowSuccessModal(true);
        }}
      />

      {/* Success  */}

      <SuccessModal
        open={showSuccessModal}
        title="تم إرسال طلب التعديل"
        description="تم إرسال طلبك إلى المعرض وسيتم التواصل معك من قبل خدمة العملاء"
        buttonText="حسناً"
        onDone={() => setShowSuccessModal(false)}
      />

      {/*Cancel Booking */}

      <CancelBookingModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);

          console.log(
            'Booking cancelled'
          );
        }}
        bookingAmount={2500}
        cancellationPercent={25}
        cancellationFee={1000}
      />

    </div>
  );
}