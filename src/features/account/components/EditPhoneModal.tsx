'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

import { PhoneField } from '@/shared/ui/PhoneField';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { useErrorMessage, useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { applyFieldErrors } from '@/shared/lib/validation';
import { phoneChangeSchema, type PhoneChangeValues } from '../validation';

interface Props {
  open: boolean;
  onClose: () => void;
  currentPhone?: string;
  /** Sends the code; resolves with the error when that fails, and the dialog keeps the number. */
  onSendCode: (phone: string) => Promise<AppError | undefined>;
  loading?: boolean;
}

export default function EditPhoneModal({
  open,
  onClose,
  currentPhone = '',
  onSendCode,
  loading = false,
}: Props) {
  const t = useTranslations('account.editPhone');
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PhoneChangeValues>({
    resolver: zodResolver(phoneChangeSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { phone: currentPhone },
  });

  useEffect(() => {
    if (!open) return;

    reset({ phone: currentPhone });
  }, [open, currentPhone, reset]);

  const handleSend = handleSubmit(async ({ phone }) => {
    if (loading) return;
    const error = await onSendCode(phone);
    if (error && !applyFieldErrors(error, setError, ['phone'])) {
      setError('root.server', { type: error.kind, message: errorMessage(error) });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="auth_modal_wrapper"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header className="auth_modal_header">
        <Dialog.Close />
      </Dialog.Header>

      {/* Same layout as the sign-in step (features/auth LoginForm). */}
      <Dialog.Body className="auth_modal">
        <form className="login_form" onSubmit={handleSend} noValidate>
          <Dialog.Title>{t('title')}</Dialog.Title>
          <p>{t('description')}</p>

          <div className="phone_wrapper">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label={t('phone')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  searchPlaceholder={t('countrySearchPlaceholder')}
                  inputAriaLabel={t('phone')}
                  required
                  error={fieldError(errors.phone?.message)}
                />
              )}
            />
          </div>

          {formError && (
            <p className="text-danger small mt-1 mb-3" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-100" size="lg" loading={loading}>
            {t('sendCode')}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
