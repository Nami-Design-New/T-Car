'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/shared/ui/Button';
import { OtpInput } from '@/shared/ui/OtpInput';
import { useErrorMessage, useFieldErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AppError } from '@/shared/lib/errors';
import { applyFieldErrors } from '@/shared/lib/validation';
import { OTP_LENGTH, otpCodeSchema, type OtpCodeValues } from '../validation';

type Props = {
  phone: string;
  onBack: () => void;
  /** Resolves with the error when verification fails; the code stays so the user can correct it. */
  onVerify: (code: string) => Promise<AppError | undefined>;
  onResend?: () => Promise<AppError | undefined>;
  loading?: boolean;
};

const OTP_RESEND_SECONDS = 30;

export default function OtpForm({ phone, onBack, onVerify, onResend, loading = false }: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const [timer, setTimer] = useState(OTP_RESEND_SECONDS);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    watch,
    formState: { errors },
  } = useForm<OtpCodeValues>({
    resolver: zodResolver(otpCodeSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const showServerError = (error: AppError) => {
    if (!applyFieldErrors(error, setError, ['code'])) {
      setError('root.server', { type: error.kind, message: errorMessage(error) });
    }
  };

  const handleResend = async () => {
    resetField('code');
    clearErrors();
    setTimer(OTP_RESEND_SECONDS);
    const error = await onResend?.();
    if (error) showServerError(error);
  };

  const onSubmit = handleSubmit(async ({ code }) => {
    if (loading) return;
    const error = await onVerify(code);
    if (error) showServerError(error);
  });

  const isComplete = watch('code').length === OTP_LENGTH;
  const formError = errors.root?.server?.message;

  return (
    <form className="otp_form" onSubmit={onSubmit} noValidate>
      <div className="otp_header">
        <button
          type="button"
          className="back_btn"
          onClick={onBack}
          aria-label={t('auth.otp.backLabel')}
        >
          <FiArrowLeft className="mirror-in-rtl" aria-hidden="true" />
        </button>

        <h2>{t('auth.otp.title')}</h2>
      </div>
      <div className="">
        <h3>{t('auth.otp.subtitle')}</h3>
        <p className="otp_description">{t('auth.otp.description', { phone })}</p>
      </div>
      <div className={'flex items-center justify-center'}>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <OtpInput
              value={field.value}
              onChange={field.onChange}
              length={OTP_LENGTH}
              autoFocus
              ariaLabel={t('auth.otp.codeLabel')}
              digitAriaLabel={(position, total) => t('auth.otp.digitLabel', { position, total })}
              error={fieldError(errors.code?.message)}
            />
          )}
        />
      </div>

      <div className="otp_resend_status" aria-live="polite">
        <p className="timer">{t('auth.otp.resendIn')}</p>
        {timer > 0 ? (
          <span className="timer"> 00:{timer} </span>
        ) : (
          <button type="button" className="resend" onClick={handleResend}>
            {t('auth.otp.resend')}
          </button>
        )}
      </div>

      {formError && (
        <p className="text-status-error text-sm mt-2 mb-0" role="alert">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!isComplete}
        loading={loading}
      >
        {t('auth.otp.verify')}
      </Button>
    </form>
  );
}
