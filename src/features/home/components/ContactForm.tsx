"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { FormInput, FormTextarea } from "@/shared/ui/Form";
import { useSendContactMessage } from "../hooks/useSendContactMessage";
import {
  contactMessageSchema,
  type ContactMessageFormValues,
  type ContactMessageValues,
} from "../validation";

const CONTACT_FIELDS = [
  "name",
  "email",
  "contactReason",
  "bookingNumber",
  "message",
] as const;

interface Props {
  title?: string;
  description?: string;
}

export default function ContactForm({ title, description }: Props) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const notify = useNotify();
  const { submitting, send } = useSendContactMessage();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactMessageFormValues, unknown, ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      contactReason: "",
      bookingNumber: "",
      message: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (submitting) return;
    const result = await send(values);
    if (result.ok) {
      notify.success(result.message);
      reset();
      return;
    }

    // The backend's validation message is a toast only; the input stays.
    if (result.error.kind === "validation" && result.error.serverMessage) {
      notify.error(result.error.serverMessage);
      return;
    }
    if (!applyFieldErrors(result.error, setError, CONTACT_FIELDS)) {
      setError("root.server", {
        type: result.error.kind,
        message: errorMessage(result.error),
      });
    }
  });

  const formError = errors.root?.server?.message;

  return (
    <form
      className="border-stroke-light bg-surface-elevated flex flex-col gap-5 rounded-xl border p-10 shadow-[0_20px_50px_rgba(30,30,30,0.05)] max-md:p-6.25"
      onSubmit={submit}
      noValidate
    >
      {(title || description) && (
        <div>
          {title && <h3 className="mb-2 text-xl font-semibold">{title}</h3>}
          {description && (
            <p className="text-text-subtle mb-0 text-sm leading-[1.8]">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-5 *:min-w-0 *:p-0 max-md:grid-cols-1">
        <FormInput
          id="name"
          label={t("contact.name")}
          placeholder={t("contact.name")}
          required
          error={fieldError(errors.name?.message)}
          {...register("name")}
        />

        <FormInput
          id="email"
          type="email"
          dir="ltr"
          label={t("contact.email")}
          placeholder={t("contact.email")}
          required
          error={fieldError(errors.email?.message)}
          {...register("email")}
        />
      </div>

      <div className="grid grid-cols-2 gap-5 *:min-w-0 *:p-0 max-md:grid-cols-1">
        <FormInput
          id="contactReason"
          label={t("contact.reason")}
          placeholder={t("contact.reasonPlaceholder")}
          maxLength={255}
          error={fieldError(errors.contactReason?.message)}
          {...register("contactReason")}
        />

        <FormInput
          id="bookingNumber"
          label={t("contact.bookingNumber")}
          placeholder={t("contact.bookingNumber")}
          error={fieldError(errors.bookingNumber?.message)}
          {...register("bookingNumber")}
        />
      </div>

      <FormTextarea
        id="message"
        label={t("contact.message")}
        placeholder={t("contact.message")}
        rows={6}
        required
        error={fieldError(errors.message?.message)}
        className="min-h-37 resize-y"
        {...register("message")}
      />

      {formError && (
        <p className="text-status-error mt-4 mb-0 text-sm" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={submitting}>
        {t("contact.send")}
      </Button>
    </form>
  );
}
