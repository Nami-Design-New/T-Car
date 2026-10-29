"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export interface ResendCountdownProps {
  seconds: number;
  onResend: () => Promise<boolean | void>;
  disabled?: boolean;
  resetKey?: string | number;
}

export function ResendCountdown({
  seconds: initialSeconds,
  onResend,
  disabled = false,
  resetKey,
}: ResendCountdownProps) {
  const t = useTranslations("auth.otp");
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds, resetKey]);

  useEffect(() => {
    if (seconds === 0) return;
    const interval = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [seconds]);

  const handleResend = async () => {
    if (seconds > 0 || disabled) return;
    const shouldReset = await onResend();
    if (shouldReset !== false) setSeconds(initialSeconds);
  };

  return (
    <div
      className="mb-3 flex min-h-11 items-center justify-between"
      aria-live="polite"
    >
      <p className="text-action-primary m-0 text-sm leading-relaxed">
        {t("resendIn")}
      </p>
      {seconds > 0 ? (
        <span className="text-action-primary text-sm leading-relaxed">
          {`00:${String(seconds).padStart(2, "0")}`}
        </span>
      ) : (
        <button
          type="button"
          className="text-text-primary cursor-pointer border-0 bg-transparent text-xs font-bold underline"
          onClick={handleResend}
          disabled={disabled}
        >
          {t("resend")}
        </button>
      )}
    </div>
  );
}
