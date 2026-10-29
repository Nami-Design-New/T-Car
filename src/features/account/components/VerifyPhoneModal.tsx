"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FiArrowLeft } from "react-icons/fi";

import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { OtpInput } from "@/shared/ui/OtpInput";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import {
  PHONE_CODE_LENGTH,
  phoneCodeSchema,
  type PhoneCodeValues,
} from "../validation";
import { BackButton } from "@/shared/ui/BackButton/BackButton";

interface Props {
  open: boolean;
  onClose: () => void;
  phone?: string;
  onEditPhone?: () => void;
  onVerified?: (phone: string) => void;
  /** Resolves with the error when the code could not be resent. */
  onResendCode: (phone: string) => Promise<AppError | undefined>;
  /** Checks the code; resolves with the error when it was rejected, and the digits stay. */
  onVerifyCode: (code: string) => Promise<AppError | undefined>;
  loading?: boolean;
}

const INITIAL_SECONDS = 30;

export default function VerifyPhoneModal({
  open,
  onClose,
  phone = "",
  onEditPhone,
  onVerified,
  onResendCode,
  onVerifyCode,
  loading = false,
}: Props) {
  const t = useTranslations("account.verifyPhone");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const [successOpen, setSuccessOpen] = useState(false);

  const [timer, setTimer] = useState(INITIAL_SECONDS);

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

  /* =========================
     Reset Modal
  ========================= */

  useEffect(() => {
    if (!open) return;

    reset({ code: "" });
    setTimer(INITIAL_SECONDS);
  }, [open, reset]);

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

  const showServerError = (error: AppError) => {
    if (!applyFieldErrors(error, setError, ["code"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  };

  /* =========================
     Verify
  ========================= */

  const handleVerify = handleSubmit(async ({ code }) => {
    if (loading) return;

    // A rejected code keeps the dialog open with the digits and the error.
    const error = await onVerifyCode(code);
    if (error) return showServerError(error);

    // show success animation/modal first
    setSuccessOpen(true);
  });

  /* =========================
     Resend
  ========================= */

  const handleResend = async () => {
    if (timer > 0 || loading) {
      return;
    }

    const error = await onResendCode(phone);
    if (error) return showServerError(error);

    setTimer(INITIAL_SECONDS);
    reset({ code: "" });
  };

  const handleSuccessDone = () => {
    setSuccessOpen(false);
    onVerified?.(phone);
  };

  const isComplete = watch("code").length === PHONE_CODE_LENGTH;
  const formError = errors.root?.server?.message;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}

        closeOnEscape={!loading}
        closeOnBackdrop={!loading}
      >
        <Dialog.Header>
          <Dialog.Title>
            <div className="flex items-center gap-2">
              <BackButton
                type="button"
                onClick={() => (onEditPhone ? onEditPhone() : onClose())}
                aria-label={t("editPhone")}
              />

              {t("title")}
            </div>
          </Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>

        {/* Same layout as the sign-in code step (features/auth OtpForm). */}
        <Dialog.Body>
          <form
            className="relative flex w-full flex-col text-center"
            onSubmit={handleVerify}
            noValidate
          >
            <p className="text-text-subtle mb-4 text-start text-base leading-relaxed">
              {t("sentTo")} <bdi dir="ltr">{phone}</bdi>
            </p>

            <div className="flex items-center justify-center">
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <OtpInput
                    value={field.value}
                    onChange={field.onChange}
                    length={PHONE_CODE_LENGTH}
                    autoFocus={open}
                    ariaLabel={t("codeLabel")}
                    digitAriaLabel={(position) =>
                      t("digitLabel", { index: position })
                    }
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
              {timer > 0 ? (
                <p className="text-action-primary m-0 text-sm leading-relaxed">
                  {t("resendIn", { seconds: timer })}
                </p>
              ) : (
                <button
                  type="button"
                  className="text-text-primary cursor-pointer border-0 bg-transparent text-xs font-bold underline disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleResend}
                  disabled={loading}
                >
                  {t("resend")}
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
              {t("verify")}
            </Button>
          </form>
        </Dialog.Body>
      </Dialog>

      <ResultDialog
        open={successOpen}
        status="success"
        description={t("successDescription")}
        onClose={handleSuccessDone}
      />
    </>
  );
}
