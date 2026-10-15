'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiArrowLeft } from 'react-icons/fi';
import { OtpInput } from '@/shared/ui/OtpInput';

type Props = {
  phone: string;
  onBack: () => void;
  onVerify: (code: string) => void;
  onResend?: () => void;
  loading?: boolean;
  /** Already translated; the entered code stays so the user can correct it. */
  error?: string;
};

const OTP_LENGTH = 4;
const OTP_RESEND_SECONDS = 30;

export default function OtpForm({
  phone,
  onBack,
  onVerify,
  onResend,
  loading = false,
  error,
}: Props) {
  const t = useTranslations();

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(OTP_RESEND_SECONDS);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = () => {
    setOtp('');
    setTimer(OTP_RESEND_SECONDS);
    onResend?.();
  };

  const code = otp;
  const isComplete = code.length === OTP_LENGTH;

  return (
    <div className="otp_form">
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
      <div className={'d-flex align-items-center justify-content-center'}>
        <OtpInput
          value={otp}
          onChange={setOtp}
          length={OTP_LENGTH}
          autoFocus
          ariaLabel={t('auth.otp.codeLabel')}
          digitAriaLabel={(position, total) => t('auth.otp.digitLabel', { position, total })}
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

      {error && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="auth_btn"
        disabled={!isComplete || loading}
        onClick={() => onVerify(code)}
      >
        {t('auth.otp.verify')}
      </button>
    </div>
  );
}
