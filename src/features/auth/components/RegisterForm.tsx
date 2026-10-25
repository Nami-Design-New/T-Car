"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FiArrowLeft } from "react-icons/fi";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { FormCheckbox, FormInput } from "@/shared/ui/Form";
import { registerFormSchema, type RegisterFormValues } from "../validation";

type Props = {
  onBack: () => void;
  /** Resolves with the error when registration fails; the form keeps its values for fixing. */
  onSubmit: (values: RegisterFormValues) => Promise<AppError | undefined>;
  loading?: boolean;
};

const FIELDS = ["fullName", "email", "birthDate", "acceptTerms"] as const;

export default function RegisterForm({
  onBack,
  onSubmit,
  loading = false,
}: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      birthDate: "",
      acceptTerms: false,
    },
  });

  const submit = handleSubmit(async (values) => {
    if (loading) return;
    const error = await onSubmit(values);
    if (error && !applyFieldErrors(error, setError, FIELDS)) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <form
      className="relative flex w-full flex-col [&>p]:mb-6 [&>p]:text-text-subtle"
      onSubmit={submit}
      noValidate
    >
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-md border border-stroke-light text-text-primary transition hover:bg-surface-on-background focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onBack}
          aria-label={t("auth.register.backLabel")}
        >
          <FiArrowLeft className="mirror-in-rtl" aria-hidden="true" />
        </button>

        <h2 className="mb-0 text-xl font-extrabold leading-relaxed text-text-primary">
          {t("auth.register.title")}
        </h2>
      </div>

      <div className="mb-5 flex flex-col gap-[18px] rounded-lg border border-action-primary/10 bg-surface-card-primary p-[18px]">
        <FormInput
          id="register-name"
          label={t("auth.register.fullNameLabel")}
          type="text"
          placeholder={t("auth.register.fullNamePlaceholder")}
          autoComplete="name"
          required
          error={fieldError(errors.fullName?.message)}
          {...register("fullName")}
        />

        <FormInput
          id="register-email"
          label={t("auth.register.emailLabel")}
          className="h-14 !border-stroke-light !bg-surface-elevated text-[15px] text-text-primary placeholder:text-text-placeholder hover:!border-action-primary/35 focus:!border-action-primary focus:!ring-4 focus:!ring-action-primary/15 [direction:ltr] text-left"
          type="email"
          dir="ltr"
          placeholder={t("auth.register.emailPlaceholder")}
          autoComplete="email"
          required
          error={fieldError(errors.email?.message)}
          {...register("email")}
        />

        <FormInput
          id="register-birth-date"
          label={t("auth.register.birthDateLabel")}
          className="h-14 !border-stroke-light !bg-surface-elevated text-[15px] text-text-subtle placeholder:text-text-placeholder hover:!border-action-primary/35 focus:!border-action-primary focus:!ring-4 focus:!ring-action-primary/15 [direction:ltr] tabular-nums"
          type="date"
          dir="ltr"
          autoComplete="bday"
          required
          error={fieldError(errors.birthDate?.message)}
          {...register("birthDate")}
        />
      </div>

      <FormCheckbox
        id="register-terms"
        className="mb-6 [&_span]:text-sm [&_span]:text-text-subtle [&_span]:leading-relaxed"
        label={t("auth.register.agreeToTerms")}
        required
        error={fieldError(errors.acceptTerms?.message)}
        {...register("acceptTerms")}
      />

      {formError && (
        <p className="text-status-error text-sm mt-2 mb-0" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {t("auth.register.submit")}
      </Button>
    </form>
  );
}
