'use client';

import BookingDailyModal from './BookingDailyModal';

import type { BookingDetails } from '@app-types/car';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: BookingDetails) => void;
  initialDetails: BookingDetails;
  pricePerDay: number;
}

export default function EditDailyBookingModal({
  open,
  onClose,
  onSubmit,
  initialDetails,
  pricePerDay,
}: Props) {
  return (
    <BookingDailyModal
      open={open}
      onClose={onClose}
      pricePerDay={pricePerDay}
      initialDetails={initialDetails}
      mode="edit"
      onConfirm={onSubmit}
    />
  );
}