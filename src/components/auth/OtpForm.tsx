'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';

type Props = {
  phone: string;
  onBack: () => void;
  onVerify: (code: string) => void;
  onResend?: () => void;
};

const OTP_LENGTH = 4;
const OTP_RESEND_SECONDS = 60;

export default function OtpForm({ phone, onBack, onVerify, onResend }: Props) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(OTP_RESEND_SECONDS);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const focusInput = (index: number) => {
    inputs.current[index]?.focus();
    inputs.current[index]?.select();
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => (next[i] = d));
      setOtp(next);

      const lastFilledIndex = Math.min(digits.length, OTP_LENGTH) - 1;
      focusInput(lastFilledIndex >= OTP_LENGTH - 1 ? OTP_LENGTH - 1 : lastFilledIndex + 1);
      return;
    }

    const copy = [...otp];
    copy[index] = value;
    setOtp(copy);

    if (value && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }

  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const copy = [...otp];
        copy[index] = '';
        setOtp(copy);
      } else if (index > 0) {
        focusInput(index - 1);
        const copy = [...otp];
        copy[index - 1] = '';
        setOtp(copy);
      }
    }
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimer(OTP_RESEND_SECONDS);
    onResend?.();
    inputs.current[0]?.focus();
  };

  const code = otp.join('');
  const isComplete = code.length === OTP_LENGTH;

  return (
    <div className="otp_form">
      <button
        type="button"
        className="back_btn otp_back_btn"
        onClick={onBack}
        aria-label={t('auth.otp.backLabel')}
      >
        <FiArrowLeft aria-hidden="true" />
      </button>

      <h2>{t('auth.otp.title')}</h2>
      <p className="otp_description">{t('auth.otp.description')}</p>
      <bdi className="phone" dir="ltr">
        {phone}
      </bdi>

      <div className="otp_inputs" dir="ltr" role="group" aria-label={t('auth.otp.codeLabel')}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            value={digit}
            className={digit ? 'is-filled' : ''}
            aria-label={t('auth.otp.digitLabel', {
              position: index + 1,
              total: OTP_LENGTH,
            })}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      <div className="otp_resend_status" aria-live="polite">
        {timer > 0 ? (
          <p className="timer">{t('auth.otp.resendIn', { seconds: timer })}</p>
        ) : (
          <button type="button" className="resend" onClick={handleResend}>
            {t('auth.otp.resend')}
          </button>
        )}
      </div>

      <button
        type="button"
        className="auth_btn"
        disabled={!isComplete}
        onClick={() => onVerify(code)}
      >
        {t('auth.otp.verify')}
      </button>
    </div>
  );
}
