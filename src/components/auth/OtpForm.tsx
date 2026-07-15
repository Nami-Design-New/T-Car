'use client';

import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

type Props = {
  phone: string;
  onBack: () => void;
  onVerify: (code: string) => void;
};

const OTP_LENGTH = 4;

export default function OtpForm({ phone, onBack, onVerify }: Props) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);

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

      if (digits.length >= OTP_LENGTH) {
        onVerify(next.join(''));
      }
      return;
    }

    const copy = [...otp];
    copy[index] = value;
    setOtp(copy);

    if (value && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }

    if (value && index === OTP_LENGTH - 1) {
      const fullCode = copy.join('');
      if (fullCode.length === OTP_LENGTH) onVerify(fullCode);
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

  return (
    <div className="otp_form">
      <button type="button" className="back_btn" onClick={onBack} aria-label="Back">
        <FiArrowLeft />
      </button>

      <h2>رمز التحقق</h2>
      <p>تم إرسال رمز التحقق إلى</p>
      <span className="phone">{phone}</span>

      <div className="otp_inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH} 
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      {timer > 0 ? (
        <p className="timer">إعادة الإرسال خلال {timer}s</p>
      ) : (
        <button className="resend">إعادة إرسال الرمز</button>
      )}

      <button className="auth_btn" onClick={() => onVerify(otp.join(''))}>
        تحقق
      </button>
    </div>
  );
}