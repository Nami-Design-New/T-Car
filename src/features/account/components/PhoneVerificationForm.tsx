"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { OtpInput } from "@/shared/ui/OtpInput";
import { ResendCountdown } from "@/shared/ui/ResendCountdown";
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
  }, [phone, reset]);

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
    if (loading) return false;
    const error = await onResendCode(phone);
    if (error) {
      showServerError(error);
      return false;
    }
    reset({ code: "" });
    return true;
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
              ariaLabel={t("auth.otp.codeLabel")}
              digitAriaLabel={(position, total) =>
                t("auth.otp.digitLabel", { position, total })
              }
              disabled={loading}
              error={fieldError(errors.code?.message)}
            />
          )}
        />
      </div>

      <ResendCountdown
        seconds={RESEND_SECONDS}
        resetKey={phone}
        onResend={handleResend}
        disabled={loading}
      />

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
