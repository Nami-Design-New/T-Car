"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { loadPhoneCountries } from "@/features/phone-countries";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import {
  parsePhoneFieldValue,
  type PhoneFieldValue,
} from "@/shared/lib/phone";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { PhoneField } from "@/shared/ui/PhoneField";
import { phoneChangeSchema, type PhoneChangeValues } from "../validation";

interface Props {
  currentPhone: string;
  onSendCode: (phone: PhoneFieldValue) => Promise<AppError | undefined>;
  loading?: boolean;
}

export default function PhoneChangeForm({
  currentPhone,
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
    defaultValues: { phone: parsePhoneFieldValue(currentPhone) },
  });

  useEffect(() => {
    reset({ phone: parsePhoneFieldValue(currentPhone) });
  }, [currentPhone, reset]);

  const onSubmit = handleSubmit(async ({ phone }) => {
    if (loading) return;
    const error = await onSendCode(phone);
    if (error?.kind === "validation" && error.serverMessage) return;
    if (error && !applyFieldErrors(error, setError, ["phone"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <form
      className="flex w-full flex-col items-center"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="mb-6 w-full">
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneField
              label={t("phone")}
              value={field.value}
              onChange={field.onChange}
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
  );
}
