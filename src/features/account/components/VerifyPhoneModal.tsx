'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Dialog } from '@/shared/ui/Dialog';
import SuccessModal from '@components/common/SuccessModal';

interface Props {
  open: boolean;
  onClose: () => void;
  phone?: string;
  onEditPhone?: () => void;
  onVerified?: (phone: string) => void;
  onResendCode?: (phone: string) => Promise<boolean>;
  /** Checks the code; resolves to false when it was rejected (the error prop says why). */
  onVerifyCode?: (code: string) => Promise<boolean>;
  loading?: boolean;
  error?: string;
}

const OTP_LENGTH = 4;
const INITIAL_SECONDS = 30;

export default function VerifyPhoneModal({
  open,
  onClose,
  phone = '',
  onEditPhone,
  onVerified,
  onResendCode,
  onVerifyCode,
  loading = false,
  error,
}: Props) {
  const t = useTranslations('account.verifyPhone');
  const [successOpen, setSuccessOpen] = useState(false);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  const [timer, setTimer] = useState(INITIAL_SECONDS);

  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  /* =========================
     Reset Modal
  ========================= */

  useEffect(() => {
    if (!open) return;

    setOtp(Array(OTP_LENGTH).fill(''));
    setTimer(INITIAL_SECONDS);

    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 0);
  }, [open]);

  /* =========================
     Timer
  ========================= */

  useEffect(() => {
    if (!open || timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, timer]);

  /* =========================
     Focus Input
  ========================= */

  const focusInput = (index: number) => {
    inputs.current[index]?.focus();
    inputs.current[index]?.select();
  };

  /* =========================
     Change OTP
  ========================= */

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    // Paste / multiple digits
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH).split('');

      const next = Array(OTP_LENGTH).fill('');

      digits.forEach((digit, i) => {
        next[i] = digit;
      });

      setOtp(next);

      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);

      focusInput(nextIndex);

      return;
    }

    const next = [...otp];

    next[index] = value;

    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  /* =========================
     Keyboard
  ========================= */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key !== 'Backspace') {
      return;
    }

    if (otp[index]) {
      const next = [...otp];

      next[index] = '';

      setOtp(next);

      return;
    }

    if (index > 0) {
      focusInput(index - 1);

      const next = [...otp];

      next[index - 1] = '';

      setOtp(next);
    }
  };

  /* =========================
     Paste
  ========================= */

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData('text').trim();

    if (!/^\d+$/.test(pasted)) {
      return;
    }

    const digits = pasted.slice(0, OTP_LENGTH).split('');

    const next = Array(OTP_LENGTH).fill('');

    digits.forEach((digit, index) => {
      next[index] = digit;
    });

    setOtp(next);

    focusInput(Math.min(digits.length, OTP_LENGTH - 1));
  };

  /* =========================
     Verify
  ========================= */

  const handleVerify = async () => {
    const code = otp.join('');

    if (code.length !== OTP_LENGTH || loading) {
      return;
    }

    // A rejected code keeps the dialog open with the digits and the error.
    const verified = (await onVerifyCode?.(code)) ?? true;
    if (!verified) return;

    // show success animation/modal first
    setSuccessOpen(true);
  };

  /* =========================
     Resend
  ========================= */

  const handleResend = async () => {
    if (timer > 0 || loading) {
      return;
    }

    const sent = (await onResendCode?.(phone)) ?? true;
    if (!sent) return;

    setTimer(INITIAL_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 0);
  };

  /* =========================
     Content
  ========================= */

  const firstInputRef = (element: HTMLInputElement | null) => {
    inputs.current[0] = element;
  };

  const handleSuccessDone = () => {
    setSuccessOpen(false);
    onVerified?.(phone);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        className="verify_modal"
        closeOnEscape={!loading}
        closeOnBackdrop={!loading}
      >
        <Dialog.Header className="verify_modal_header">
          <Dialog.Title>{t('title')}</Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>

        <Dialog.Body className="otp_form">
          <p>{t('sentTo')}</p>

          <span className="phone">{phone}</span>

          {/* Edit Phone */}

          <button
            type="button"
            className="edit_phone_btn"
            onClick={() => (onEditPhone ? onEditPhone() : onClose())}
          >
            {t('editPhone')}
          </button>

          {/* OTP */}

          <div className="otp_inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  if (index === 0) firstInputRef(element);
                  else inputs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={t('digitLabel', { index: index + 1 })}
              />
            ))}
          </div>

          {/* Timer */}

          {timer > 0 ? (
            <p className="timer">{t('resendIn', { seconds: timer })}</p>
          ) : (
            <button type="button" className="resend" onClick={handleResend} disabled={loading}>
              {t('resend')}
            </button>
          )}

          {error && (
            <p className="text-danger small mt-2 mb-0" role="alert">
              {error}
            </p>
          )}

          {/* Confirm */}

          <button
            type="button"
            className="auth_btn"
            onClick={handleVerify}
            disabled={otp.join('').length !== OTP_LENGTH || loading}
            aria-busy={loading}
          >
            {t('verify')}
          </button>
        </Dialog.Body>
      </Dialog>

      <SuccessModal
        open={successOpen}
        title={t('successTitle')}
        description={t('successDescription')}
        onDone={handleSuccessDone}
      />
    </>
  );
}
