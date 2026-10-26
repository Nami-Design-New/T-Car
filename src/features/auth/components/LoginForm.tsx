"use client";

import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/Button";
import { PhoneField } from "@/shared/ui/PhoneField";
import { phoneCountriesApi } from "@/services/phoneCountries.api";
import {
  formatPhoneFieldValue,
  parsePhoneFieldValue,
} from "@/shared/lib/phone";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { phoneSchema, type PhoneFormValues } from "../validation";
import { IMAGES } from "@/shared/config/assets";
const logo = IMAGES.brandMark;
import { ICONS } from "@/shared/config/assets";
const whatsappIcon = ICONS.whatsapp;

type Props = {
  /** Sends the code to this phone; resolves with the error when that fails. */
  onNext: (phone: string) => Promise<AppError | undefined>;
  loading?: boolean;
};

export default function LoginForm({ onNext, loading = false }: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { phone: "+966" },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    if (loading) return;
    const error = await onNext(phone);
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
      <div className="mb-6">
        <Image
          src={logo}
          alt={t("auth.login.logoAlt")}
          width={70}
          height={70}
        />
      </div>

      <h2 className="text-text-primary">{t("auth.login.title")}</h2>
      <p className="text-text-subtle mb-7">{t("auth.login.description")}</p>

      <div className="mb-6 w-full">
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneField
              label={t("auth.login.phoneLabel")}
              value={parsePhoneFieldValue(field.value)}
              onChange={(phone) => field.onChange(formatPhoneFieldValue(phone))}
              loadCountries={phoneCountriesApi.listCountries}
              onBlur={field.onBlur}
              searchPlaceholder={t("auth.login.countrySearchPlaceholder")}
              inputAriaLabel={t("auth.login.phoneLabel")}
              required
              error={fieldError(errors.phone?.message)}
            />
          )}
        />
      </div>

      {formError && (
        <p className="text-status-error mt-1 mb-0 text-sm" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        <span
          className="grid size-[30px] shrink-0 place-items-center rounded-sm border border-white/20 bg-white/10"
          aria-hidden="true"
        >
          <Image src={whatsappIcon} alt="" width={18} height={18} />
        </span>
        {t("auth.login.sendViaWhatsApp")}
      </Button>
    </form>
  );
}
