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
import { BackButton } from "@/shared/ui/BackButton/BackButton";
import { Link } from "@/i18n/navigation";

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
      className="[&>p]:text-text-subtle relative flex w-full flex-col [&>p]:mb-6"
      onSubmit={submit}
      noValidate
    >
      <div className="mt-2 mb-6 flex items-center gap-2">
        <BackButton onClick={onBack} />
        <h2 className="text-text-primary mb-0 text-xl leading-relaxed font-extrabold">
          {t("auth.register.title")}
        </h2>
      </div>

      <div className="mb-5 flex flex-col gap-4.5">
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
          className="!border-stroke-light !bg-surface-elevated text-text-primary placeholder:text-text-placeholder hover:!border-action-primary/35 focus:!border-action-primary focus:!ring-action-primary/15 h-14 text-left text-[15px] [direction:ltr] focus:!ring-4"
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
          className="!border-stroke-light !bg-surface-elevated text-text-subtle placeholder:text-text-placeholder hover:!border-action-primary/35 focus:!border-action-primary focus:!ring-action-primary/15 h-14 text-[15px] tabular-nums [direction:ltr] focus:!ring-4"
          type="date"
          dir="ltr"
          autoComplete="bday"
          required
          error={fieldError(errors.birthDate?.message)}
          {...register("birthDate")}
        />
      </div>
      <p className="mt-4 text-center text-sm">
        <span>بمتابعتك، فإنك توافق على </span>{" "}
        <Link className="text-action-primary" href="/terms">
          الشروط والأحكام
        </Link>{" "}
        <br />و{" "}
        <Link className="text-action-primary" href="/privacy">
          سياسة الخصوصية
        </Link>{" "}
        الخاصة بالتطبيق.
      </p>

      {formError && (
        <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {t("auth.register.submit")}
      </Button>
    </form>
  );
}
