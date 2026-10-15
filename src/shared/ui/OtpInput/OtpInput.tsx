'use client';

import { useEffect, useRef } from 'react';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  ariaLabel: string;
  digitAriaLabel?: (position: number, total: number) => string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 4,
  ariaLabel,
  digitAriaLabel = (position, total) => `Digit ${position} of ${total}`,
  autoFocus = false,
  disabled = false,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const focusInput = (index: number) => {
    inputs.current[index]?.focus();
    inputs.current[index]?.select();
  };

  const updateDigits = (digits: string) => {
    onChange(digits.replace(/\D/g, '').slice(0, length));
  };

  const handleChange = (nextValue: string, index: number) => {
    const digits = nextValue.replace(/\D/g, '');

    if (digits.length > 1) {
      updateDigits(digits);
      focusInput(Math.min(digits.length, length) - 1);
      return;
    }

    const next = value.padEnd(length, ' ').split('');
    next[index] = digits;
    onChange(next.join('').replace(/\s/g, '').slice(0, length));

    if (digits && index < length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== 'Backspace') return;

    const current = value.padEnd(length, ' ').split('');

    if (current[index]?.trim()) {
      current[index] = '';
      onChange(current.join('').replace(/\s/g, '').slice(0, length));
      return;
    }

    if (index > 0) {
      current[index - 1] = '';
      onChange(current.join('').replace(/\s/g, '').slice(0, length));
      focusInput(index - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text');
    if (!pasted) return;

    updateDigits(pasted);
    focusInput(Math.min(pasted.replace(/\D/g, '').length, length) - 1);
  };

  return (
    <div className="otp-inputs" onPaste={handlePaste} dir="ltr" role="group" aria-label={ariaLabel}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={length}
          value={value[index] ?? ''}
          disabled={disabled}
          aria-label={digitAriaLabel(index + 1, length)}
          onChange={(event) => handleChange(event.target.value, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  );
}
