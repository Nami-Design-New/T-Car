'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Dialog } from '@/shared/ui/Dialog';
import { OtpInput } from '@/shared/ui/OtpInput';
import { ResultDialog } from '@/shared/ui/ResultDialog';

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

  const [otp, setOtp] = useState('');

  const [timer, setTimer] = useState(INITIAL_SECONDS);

  /* =========================
     Reset Modal
  ========================= */

  useEffect(() => {
    if (!open) return;

    setOtp('');
    setTimer(INITIAL_SECONDS);
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
     Verify
  ========================= */

  const handleVerify = async () => {
    const code = otp;

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
    setOtp('');
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

          <OtpInput
            value={otp}
            onChange={setOtp}
            length={OTP_LENGTH}
            autoFocus={open}
            ariaLabel={t('codeLabel')}
            digitAriaLabel={(position) => t('digitLabel', { index: position })}
            disabled={loading}
          />

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
            disabled={otp.length !== OTP_LENGTH || loading}
            aria-busy={loading}
          >
            {t('verify')}
          </button>
        </Dialog.Body>
      </Dialog>

      <ResultDialog
        open={successOpen}
        status="success"

        description={t('successDescription')}
        onClose={handleSuccessDone}
      />
    </>
  );
}
