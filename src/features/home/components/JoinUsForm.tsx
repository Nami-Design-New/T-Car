"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput, FormSelect } from "@/shared/ui/Form";
import { PhoneField } from "@/shared/ui/PhoneField";
import { loadPhoneCountries } from "@/features/phone-countries";
import { useJoinUs } from "../hooks/useJoinUs";
import {
  joinUsSchema,
  type JoinUsFormValues,
  type JoinUsValues,
} from "../validation";

const JOIN_US_FIELDS = [
  "name",
  "phone",
  "companyName",
  "email",
  "companySizeId",
] as const;

const EMPTY_FORM: JoinUsFormValues = {
  name: "",
  phone: { countryCode: "+966", phone: "" },
  companyName: "",
  email: "",
  companySizeId: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Partner request (POST /join-us). The company sizes come from GET /settings;
 * the backend's success and validation messages are toasts.
 */
export default function JoinUsForm({ open, onClose }: Props) {
  const t = useTranslations("joinUs");
  const tStates = useTranslations("states");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const notify = useNotify();
  const { sizes, submitting, send } = useJoinUs(open);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<JoinUsFormValues, unknown, JoinUsValues>({
    resolver: zodResolver(joinUsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) reset(EMPTY_FORM);
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    if (submitting) return;
    const result = await send(values);
    if (result.ok) {
      notify.success(result.message);
      onClose();
      return;
    }

    // The backend's validation message is a toast only; the input stays.
    if (result.error.kind === "validation" && result.error.serverMessage) {
      notify.error(result.error.serverMessage);
      return;
    }
    if (!applyFieldErrors(result.error, setError, JOIN_US_FIELDS)) {
      setError("root.server", {
        type: result.error.kind,
        message: errorMessage(result.error),
      });
    }
  });

  const handleClose = () => {
    if (!submitting) onClose();
  };
  const formError = errors.root?.server?.message;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="lg"
      className="p-0"
      label={t("title")}
      closeOnEscape={!submitting}
      closeOnBackdrop={!submitting}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="pt-5 pb-7">
        <form
          id="join-us-form"
          className="flex flex-col"
          onSubmit={submit}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4.5 max-md:grid-cols-1">
            <FormInput
              id="join-us-name"
              label={t("fields.firstName.label")}
              placeholder={t("fields.firstName.placeholder")}
              autoComplete="name"
              required
              error={fieldError(errors.name?.message)}
              {...register("name")}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  label={t("fields.phone.label")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  loadCountries={loadPhoneCountries}
                  searchPlaceholder={t("fields.phone.searchPlaceholder")}
                  inputAriaLabel={t("fields.phone.label")}
                  required
                  error={fieldError(errors.phone?.message)}
                />
              )}
            />

            <FormInput
              id="join-us-company-name"
              label={t("fields.companyName.label")}
              placeholder={t("fields.companyName.placeholder")}
              autoComplete="organization"
              required
              error={fieldError(errors.companyName?.message)}
              {...register("companyName")}
            />

            <div className="flex flex-col gap-2">
              <FormSelect
                id="join-us-company-size"
                label={t("fields.companySize.label")}
                options={sizes.items.map(({ id, size }) => ({
                  value: id,
                  label: t("companySizeOption", { size }),
                }))}
                disabled={sizes.loading || Boolean(sizes.error)}
                aria-busy={sizes.loading}
                required
                error={fieldError(errors.companySizeId?.message)}
                {...register("companySizeId")}
              />
              {sizes.loading && (
                <span className="text-text-subtle text-[13px]" role="status">
                  {tStates("loading")}
                </span>
              )}
              {sizes.error && (
                <span className="text-status-error flex items-center gap-2 text-[13px]">
                  {errorMessage(sizes.error)}
                  <button
                    type="button"
                    className="text-action-primary font-semibold underline"
                    onClick={() => void sizes.retry()}
                  >
                    {tStates("retry")}
                  </button>
                </span>
              )}
            </div>

            <FormInput
              id="join-us-email"
              type="email"
              dir="ltr"
              label={t("fields.email.label")}
              placeholder={t("fields.email.placeholder")}
              autoComplete="email"
              required
              error={fieldError(errors.email?.message)}
              {...register("email")}
            />
          </div>

          {formError && (
            <p className="text-status-error mt-4 mb-0 text-sm" role="alert">
              {formError}
            </p>
          )}
        </form>
      </Dialog.Body>

      <Dialog.Footer>
        <Button
          type="submit"
          className="w-full"
          form="join-us-form"
          size="lg"
          loading={submitting}
        >
          {t("submit")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
