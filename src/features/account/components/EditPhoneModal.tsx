"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { PhoneField } from "@/shared/ui/PhoneField";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { phoneChangeSchema, type PhoneChangeValues } from "../validation";

interface Props {
  open: boolean;
  onClose: () => void;
  currentPhone?: string;
  /** Sends the code; resolves with the error when that fails, and the dialog keeps the number. */
  onSendCode: (phone: string) => Promise<AppError | undefined>;
  loading?: boolean;
}

export default function EditPhoneModal({
  open,
  onClose,
  currentPhone = "",
  onSendCode,
  loading = false,
}: Props) {
  const t = useTranslations("account.editPhone");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PhoneChangeValues>({
    resolver: zodResolver(phoneChangeSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { phone: currentPhone },
  });

  useEffect(() => {
    if (!open) return;

    reset({ phone: currentPhone });
  }, [open, currentPhone, reset]);

  const handleSend = handleSubmit(async ({ phone }) => {
    if (loading) return;
    const error = await onSendCode(phone);
    if (error && !applyFieldErrors(error, setError, ["phone"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="overflow-hidden rounded-xl border-0 p-0"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header className="border-0 px-10 pt-3">
        <Dialog.Close />
      </Dialog.Header>

      {/* Same layout as the sign-in step (features/auth LoginForm). */}
      <Dialog.Body className="px-10 pt-0 pb-10">
        <form
          className="flex w-full flex-col items-center"
          onSubmit={handleSend}
          noValidate
        >
          <Dialog.Title className="text-text-primary">
            {t("title")}
          </Dialog.Title>
          <p className="mb-7 text-text-subtle">{t("description")}</p>

          <div className="mb-6 w-full">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label={t("phone")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  searchPlaceholder={t("countrySearchPlaceholder")}
                  inputAriaLabel={t("phone")}
                  required
                  error={fieldError(errors.phone?.message)}
                />
              )}
            />
          </div>

          {formError && (
            <p className="text-status-error text-sm mt-1 mb-4" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t("sendCode")}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
