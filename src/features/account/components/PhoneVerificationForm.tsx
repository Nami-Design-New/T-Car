"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { OtpInput } from "@/shared/ui/OtpInput";
import {
  PHONE_CODE_LENGTH,
  phoneCodeSchema,
  type PhoneCodeValues,
} from "../validation";

interface Props {
  phone: string;
  onEditPhone?: () => void;
  onResendCode: (phone: string) => Promise<AppError | undefined>;
  onVerifyCode: (code: string) => Promise<AppError | undefined>;
  onVerified: (phone: string) => void;
  loading?: boolean;
}

const RESEND_SECONDS = 30;

export default function PhoneVerificationForm({
  phone,
  onResendCode,
  onEditPhone,
  onVerifyCode,
  onVerified,
  loading = false,
}: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<PhoneCodeValues>({
    resolver: zodResolver(phoneCodeSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { code: "" },
  });

  useEffect(() => {
    reset({ code: "" });
    setTimer(RESEND_SECONDS);
  }, [phone, reset]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = window.setInterval(
      () => setTimer((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [timer]);

  const showServerError = (error: AppError) => {
    if (!applyFieldErrors(error, setError, ["code"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  };

  const onSubmit = handleSubmit(async ({ code }) => {
    if (loading) return;
    const error = await onVerifyCode(code);
    if (error) return showServerError(error);
    onVerified(phone);
  });

  const handleResend = async () => {
    if (timer > 0 || loading) return;
    const error = await onResendCode(phone);
    if (error) return showServerError(error);
    reset({ code: "" });
    setTimer(RESEND_SECONDS);
  };

  const formError = errors.root?.server?.message;
  const isComplete = watch("code").length === PHONE_CODE_LENGTH;

  return (
    <form
      className="flex w-full flex-col text-center"
      onSubmit={onSubmit}
      noValidate
    >
      {/* <p className="text-text-subtle mb-4 text-start text-base leading-relaxed">
        {t("sentTo")} <bdi dir="ltr">{phone}</bdi>
      </p> */}
      <div className="">
        <h3 className="text-text-primary text-start text-2xl font-semibold">
          {t("auth.otp.subtitle")}
        </h3>
        <p className="text-text-subtle mb-4 text-start text-base leading-relaxed">
          {t("auth.otp.description", { phone })}
        </p>
        {onEditPhone && (
          <button
            type="button"
            className="text-action-primary mb-4 block cursor-pointer border-0 bg-transparent p-0 text-start text-sm font-semibold underline"
            onClick={onEditPhone}
            disabled={loading}
          >
            {t("auth.otp.editNumber")}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center">
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <OtpInput
              value={field.value}
              onChange={field.onChange}
              length={PHONE_CODE_LENGTH}
              autoFocus
              ariaLabel={t("title")}
              digitAriaLabel={(index) => t("digitLabel", { index })}
              disabled={loading}
              error={fieldError(errors.code?.message)}
            />
          )}
        />
      </div>

      <div
        className="mb-3 flex min-h-11 items-center justify-between"
        aria-live="polite"
      >
        <p className="text-action-primary m-0 text-sm leading-relaxed">
          {t("auth.otp.resendIn")}
        </p>
        {timer > 0 ? (
          <span className="text-action-primary text-sm leading-relaxed">
            {" "}
            00:{String(timer).padStart(2, "0")}{" "}
          </span>
        ) : (
          <button
            type="button"
            className="text-text-primary cursor-pointer border-0 bg-transparent text-xs font-bold underline"
            onClick={handleResend}
          >
            {t("auth.otp.resend")}
          </button>
        )}
      </div>

      {formError && (
        <p className="text-status-error mt-0 mb-4 text-sm" role="alert">
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
        {t("account.verifyPhone.verify")}
      </Button>
    </form>
  );
}
