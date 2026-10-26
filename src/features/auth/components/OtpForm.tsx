"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FiArrowLeft } from "react-icons/fi";
import { Button } from "@/shared/ui/Button";
import { OtpInput } from "@/shared/ui/OtpInput";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { OTP_LENGTH, otpCodeSchema, type OtpCodeValues } from "../validation";
import { BackButton } from "@/shared/ui/BackButton";

type Props = {
  phone: string;
  onBack: () => void;
  /** Resolves with the error when verification fails; the code stays so the user can correct it. */
  onVerify: (code: string) => Promise<AppError | undefined>;
  onResend?: () => Promise<AppError | undefined>;
  loading?: boolean;
};

const OTP_RESEND_SECONDS = 30;

export default function OtpForm({
  phone,
  onBack,
  onVerify,
  onResend,
  loading = false,
}: Props) {
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
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const showServerError = (error: AppError) => {
    if (!applyFieldErrors(error, setError, ["code"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  };

  const handleResend = async () => {
    resetField("code");
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

  const isComplete = watch("code").length === OTP_LENGTH;
  const formError = errors.root?.server?.message;

  return (
    <form
      className="relative flex w-full flex-col text-center"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="mb-6 flex items-center gap-2">
        <BackButton onClick={onBack} />

        <h2 className="text-text-primary mb-0 text-xl leading-relaxed font-extrabold">
          {t("auth.otp.title")}
        </h2>
      </div>
      <div className="">
        <h3 className="text-text-primary text-start text-2xl font-semibold">
          {t("auth.otp.subtitle")}
        </h3>
        <p className="text-text-subtle mb-4 text-start text-base leading-relaxed">
          {t("auth.otp.description", { phone })}
        </p>
      </div>
      <div className={"flex items-center justify-center"}>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <OtpInput
              value={field.value}
              onChange={field.onChange}
              length={OTP_LENGTH}
              autoFocus
              ariaLabel={t("auth.otp.codeLabel")}
              digitAriaLabel={(position, total) =>
                t("auth.otp.digitLabel", { position, total })
              }
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
            00:{timer}{" "}
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
        <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
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
        {t("auth.otp.verify")}
      </Button>
    </form>
  );
}
