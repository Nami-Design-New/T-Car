'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FiStar } from 'react-icons/fi';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { FormTextarea } from '@/shared/ui/Form';
import { useErrorMessage, useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { Result } from '@/shared/lib/result';
import type { BookingReviewInput } from '../model';
import { bookingReviewSchema, type BookingReviewFormValues } from '../validation';

interface Props {
  submitting?: boolean;
  onSubmit: (input: BookingReviewInput) => Promise<Result<void>>;
  onClose: () => void;
}

export default function BookingReviewModal({ submitting = false, onSubmit, onClose }: Props) {
  const t = useTranslations('myBookings.review');
  const [hoverRating, setHoverRating] = useState(0);
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingReviewFormValues>({
    resolver: zodResolver(bookingReviewSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { rating: 0, review: '' },
  });
  const rating = watch('rating');

  const submit = handleSubmit(async (values) => {
    if (submitting) return;

    const result = await onSubmit(values);
    if (result.ok) {
      onClose();
      return;
    }

    for (const [field, message] of Object.entries(result.error.fieldErrors ?? {})) {
      if (field === 'rating' || field === 'review') {
        setError(field, { type: 'server', message });
      }
    }
    if (!result.error.fieldErrors || Object.keys(result.error.fieldErrors).length === 0) {
      setError('root.server', { type: 'server', message: errorMessage(result.error) });
    }
  });

  return (
    <Dialog open onClose={onClose} label={t('dialogLabel')}>
      <form className="review-modal" onSubmit={submit} noValidate onClick={(e) => e.stopPropagation()}>
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Close className="close_btn" />
        <p className="review-modal-subtitle">{t('subtitle')}</p>

        <div
          className="review-modal-stars"
          role="radiogroup"
          aria-label={t('ratingLabel')}
          aria-invalid={Boolean(errors.rating)}
          aria-describedby={errors.rating ? 'review-rating-error' : undefined}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              className={star <= (hoverRating || rating) ? 'filled' : ''}
              aria-checked={rating === star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => {
                setValue('rating', star, { shouldDirty: true, shouldValidate: true });
                clearErrors();
              }}
              aria-label={t('stars', { count: star })}
            >
              <FiStar />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p id="review-rating-error" className="form_error" role="alert">
            {fieldError(errors.rating.message)}
          </p>
        )}

        <FormTextarea
          id="booking-review"
          label={t('reviewLabel')}
          placeholder={t('placeholder')}
          rows={4}
          error={fieldError(errors.review?.message)}
          {...register('review')}
        />

        {errors.root?.server?.message && (
          <p className="text-status-error text-sm mb-2" role="alert">
            {errors.root.server.message}
          </p>
        )}

        <Button
          type="submit"
          className="review-modal-submit"
          loading={submitting}
          disabled={!rating}
        >
          {submitting ? t('sending') : t('submit')}
        </Button>
      </form>
    </Dialog>
  );
}
