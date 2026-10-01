'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
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

const RESULT_KEYS: Record<ResultKind, { title: string; description: string; failure: string }> = {
  extended: { title: 'extendedTitle', description: 'empty', failure: 'extendedFailure' },
  editRequested: { title: 'editRequestedTitle', description: 'editRequestedDescription', failure: 'editRequestedFailure' },
  cancelled: { title: 'cancelledTitle', description: 'empty', failure: 'cancelledFailure' },
};

export default function BookingDetailsHeader({ booking }: Props) {
  const t = useTranslations('myBookings.details');
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
      <Link href={bookingsListPath(bookingTabFor(booking.status))} className="back_link" aria-label={t('back')}>
        <FiArrowRight />
      </Link>

      {/* Title */}
      <div className="booking-details-header-title">
        <h1>{t('title')}</h1>

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
            aria-label={t('actions')}
            aria-expanded={showActions}
          >
            <FiMoreVertical />
          </button>

          {/* Menu */}
          {showActions && (
            <div className="booking-actions-menu">
              <button type="button" onClick={() => open('edit')}>
                <FiEdit2 />
                <span>{t('requestEdit')}</span>
              </button>

              <button type="button" onClick={() => open('extend')}>
                <FiCalendar />
                <span>{t('extend')}</span>
              </button>

              <button type="button" className="danger" onClick={() => open('cancel')}>
                <FiX />
                <span>{t('cancel')}</span>
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
          title={t(RESULT_KEYS[flow.kind].title)}
          description={t(RESULT_KEYS[flow.kind].description)}
          buttonText={t('ok')}
          onDone={close}
        />
      )}

      <FailedModal
        open={flow.step === 'result' && Boolean(flow.error)}
        title={flow.step === 'result' ? t(RESULT_KEYS[flow.kind].failure) : undefined}
        description={flow.step === 'result' && flow.error ? errorMessage(flow.error) : undefined}
        onDone={close}
      />
    </div>
  );
}
