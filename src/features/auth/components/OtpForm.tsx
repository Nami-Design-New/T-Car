"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/Button";
import { OtpInput } from "@/shared/ui/OtpInput";
import { ResendCountdown } from "@/shared/ui/ResendCountdown";
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
  /** Goes back to the phone step with the number filled in, to correct it. */
  onEditPhone?: () => void;
  /** Resolves with the error when verification fails; the code stays so the user can correct it. */
  onVerify: (code: string) => Promise<AppError | undefined>;
  onResend?: () => Promise<AppError | undefined>;
  loading?: boolean;
};

const OTP_RESEND_SECONDS = 30;

export default function OtpForm({
  phone,
  onBack,
  onEditPhone,
  onVerify,
  onResend,
  loading = false,
}: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

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
    const error = await onResend?.();
    if (error) showServerError(error);
    return true;
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
        <BackButton onClick={onBack} aria-label={t("auth.otp.backLabel")} />

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

      <ResendCountdown
        seconds={OTP_RESEND_SECONDS}
        onResend={handleResend}
        disabled={loading}
      />

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
