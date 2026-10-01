'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/navigation';
import { FiArrowRight, FiMoreVertical, FiEdit2, FiCalendar, FiX } from 'react-icons/fi';

import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { ResultDialog } from '@/shared/ui/ResultDialog';
import {
  bookingTabFor,
  bookingsListPath,
  cancellationFee,
  isActiveBooking,
  toEditRequest,
  type BookingDetailsView,
  type BookingEditRequest,
} from '../model';
import { useBookingActions } from '../hooks/useBookingActions';
const ExtendDurationModal = dynamic(() => import('./ExtendDurationModal'), { ssr: false });
const EditDailyBookingModal = dynamic(() => import('./EditDailyBookingModal'), { ssr: false });
const CancelBookingModal = dynamic(() => import('./CancelBookingModal'), { ssr: false });

interface LegacyResultProps {
  open: boolean;
  title?: string;
  description?: string;
  onDone?: () => void;
  buttonText?: string;
}

function SuccessModal({ open, title = '', description, onDone }: LegacyResultProps) {
  return <ResultDialog open={open} status="success" title={title} description={description} onClose={onDone ?? (() => undefined)} />;
}

function FailedModal({ open, title = '', description, onDone }: LegacyResultProps) {
  return <ResultDialog open={open} status="error" title={title} description={description} onClose={onDone ?? (() => undefined)} />;
}

interface Props {
  booking: BookingDetailsView;
}

type ResultKind = 'extended' | 'editRequested' | 'cancelled';

/** One dialog at a time. A failed extend or cancel keeps its dialog open with the error. */
type HeaderFlow =
  | { step: 'idle' }
  | { step: 'extend'; error?: AppError }
  | { step: 'edit' }
  | { step: 'cancel'; error?: AppError }
  | { step: 'result'; kind: ResultKind; error?: AppError }; // no error means success

const RESULTS: Record<ResultKind, { title: string; description: string; failure: string }> = {
  extended: { title: 'تم تمديد الحجز بنجاح', description: '', failure: 'فشل في تمديد الحجز' },
  editRequested: {
    title: 'تم إرسال طلب التعديل',
    description: 'تم إرسال طلبك إلى المعرض وسيتم التواصل معك من قبل خدمة العملاء',
    failure: 'فشل في إرسال طلب التعديل',
  },
  cancelled: { title: 'تم إلغاء الحجز', description: '', failure: 'فشل في إلغاء الحجز' },
};

export default function BookingDetailsHeader({ booking }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [flow, setFlow] = useState<HeaderFlow>({ step: 'idle' });
  const { submitting, extend, requestEdit, cancel } = useBookingActions(booking.id);
  const errorMessage = useErrorMessage();

  const close = useCallback(() => setFlow({ step: 'idle' }), []);
  const open = (step: 'extend' | 'edit' | 'cancel') => {
    setShowActions(false);
    setFlow({ step });
  };

  const isActive = isActiveBooking(booking.status);
  const fee = cancellationFee(booking.total, booking.cancellationPercent);

  const handleExtend = async (days: number) => {
    const result = await extend(days);
    setFlow(
      result.ok ? { step: 'result', kind: 'extended' } : { step: 'extend', error: result.error }
    );
  };

  // The edit form belongs to the booking flow and cannot show an inline error
  // yet, so a failure closes it and shows the failure dialog instead.
  const handleEdit = async (request: BookingEditRequest) => {
    const result = await requestEdit(request);
    setFlow({ step: 'result', kind: 'editRequested', error: result.ok ? undefined : result.error });
  };

  const handleCancel = async () => {
    if (submitting) return;
    const result = await cancel();
    setFlow(
      result.ok ? { step: 'result', kind: 'cancelled' } : { step: 'cancel', error: result.error }
    );
  };

  return (
    <div className="booking-details-header">
      {/* Back */}
      <Link href={bookingsListPath(bookingTabFor(booking.status))} className="back_link" aria-label="رجوع">
        <FiArrowRight />
      </Link>

      {/* Title */}
      <div className="booking-details-header-title">
        <h1>تفاصيل الحجز</h1>

        <span className="reference">#{booking.reference}</span>
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
              <button type="button" onClick={() => open('edit')}>
                <FiEdit2 />
                <span>طلب تعديل</span>
              </button>

              <button type="button" onClick={() => open('extend')}>
                <FiCalendar />
                <span>تمديد المدة</span>
              </button>

              <button type="button" className="danger" onClick={() => open('cancel')}>
                <FiX />
                <span>إلغاء</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ExtendDurationModal
        open={flow.step === 'extend'}
        onClose={() => {
          if (!submitting) close();
        }}
        onConfirm={handleExtend}
        currentDays={booking.days}
        pricePerDay={booking.pricePerDay}
        loading={submitting}
        error={flow.step === 'extend' && flow.error ? errorMessage(flow.error) : undefined}
      />

      <EditDailyBookingModal
        open={flow.step === 'edit'}
        onClose={close}
        pricePerDay={booking.pricePerDay}
        initialDetails={toEditRequest(booking)}
        onSubmit={handleEdit}
      />

      <CancelBookingModal
        open={flow.step === 'cancel'}
        onClose={() => {
          if (!submitting) close();
        }}
        onConfirm={handleCancel}
        bookingAmount={booking.total}
        cancellationPercent={booking.cancellationPercent}
        cancellationFee={fee}
        loading={submitting}
        error={flow.step === 'cancel' && flow.error ? errorMessage(flow.error) : undefined}
      />

      {flow.step === 'result' && !flow.error && (
        <SuccessModal
          open
          title={RESULTS[flow.kind].title}
          description={RESULTS[flow.kind].description}
          buttonText="حسناً"
          onDone={close}
        />
      )}

      <FailedModal
        open={flow.step === 'result' && Boolean(flow.error)}
        title={flow.step === 'result' ? RESULTS[flow.kind].failure : undefined}
        description={flow.step === 'result' && flow.error ? errorMessage(flow.error) : undefined}
        onDone={close}
      />
    </div>
  );
}
