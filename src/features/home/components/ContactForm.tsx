"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { FormInput, FormSelect, FormTextarea } from "@/shared/ui/Form";
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

export default function ContactForm() {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const { submitting, send } = useSendContactMessage();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactMessageFormValues, unknown, ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    mode: "onBlur",
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
      reset();
      setError("root.server", { type: "success", message: "" });
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
  const sent = errors.root?.server?.type === "success";

  return (
    <form className="contact_form" onSubmit={submit} noValidate>
      <div className="row">
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

      <div className="row">
        <FormSelect
          id="contactReason"
          label={t("contact.reason")}
          options={[
            { value: "booking", label: t("contact.reasons.booking") },
            { value: "car-rental", label: t("contact.reasons.carRental") },
            { value: "payment", label: t("contact.reasons.payment") },
            { value: "partnership", label: t("contact.reasons.partnership") },
            { value: "other", label: t("contact.reasons.other") },
          ]}
          required
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
        {...register("message")}
      />

      {formError && !sent && (
        <p className="text-danger small mt-3 mb-0" role="alert">
          {formError}
        </p>
      )}
      {sent && (
        <p className="text-success small mt-3 mb-0" role="status">
          {t("contact.sent")}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="contact_btn"
        loading={submitting}
      >
        {t("contact.send")}
      </Button>
    </form>
  );
}
