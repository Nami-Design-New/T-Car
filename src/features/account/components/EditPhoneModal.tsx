"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { PhoneField } from "@/shared/ui/PhoneField";
import { loadPhoneCountries } from "@/features/phone-countries";
import {
  formatPhoneFieldValue,
  parsePhoneFieldValue,
} from "@/shared/lib/phone";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { legacyPhoneChangeSchema, type LegacyPhoneChangeValues } from "../validation";

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
  } = useForm<LegacyPhoneChangeValues>({
    resolver: zodResolver(legacyPhoneChangeSchema),
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
      closeOnEscape={!loading}
      size="md"
      closeOnBackdrop={!loading}
    >
      <Dialog.Header>
        <Dialog.Title> {t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      {/* Same layout as the sign-in step (features/auth LoginForm). */}
      <Dialog.Body>
        <form
          className="flex w-full flex-col items-center"
          onSubmit={handleSend}
          noValidate
        >
          <div className="mb-6 w-full">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label={t("phone")}
                  value={parsePhoneFieldValue(field.value)}
                  onChange={(phone) =>
                    field.onChange(formatPhoneFieldValue(phone))
                  }
                  loadCountries={loadPhoneCountries}
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
            <p className="text-status-error mt-1 mb-4 text-sm" role="alert">
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
