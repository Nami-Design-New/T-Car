'use client';

import { BookingDailyModal, type BookingDetails } from '@/features/booking';
import type { Result } from '@/shared/lib/result';


interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: BookingDetails) => Promise<Result<void>>;
  initialDetails: BookingDetails;
  pricePerDay: number;
  loading?: boolean;
}

export default function EditDailyBookingModal({
  open,
  onClose,
  onSubmit,
  initialDetails,
  pricePerDay,
  loading = false,
}: Props) {
  return (
    <BookingDailyModal
      open={open}
      onClose={onClose}
      pricePerDay={pricePerDay}
      initialDetails={initialDetails}
      mode="edit"
      onConfirm={onSubmit}
      loading={loading}
    />
  );
}
