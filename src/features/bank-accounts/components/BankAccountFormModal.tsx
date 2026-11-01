"use client";

import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormInput } from "@/shared/ui/Form";
import {
  normalizeIban,
  type Bank,
  type BankAccount,
  type BankAccountPayload,
} from "../model";
import { bankAccountSchema, type BankAccountFormValues } from "../validation";
import BankSelect from "./BankSelect";

interface Props {
  open: boolean;
  mode: "add" | "edit";
  /** The account being edited; its values pre-fill the form. */
  account?: BankAccount;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: BankAccountPayload) => Promise<AppError | undefined>;
}

/** Add / edit bank account sheet: bank picker (`BankSelect`) plus IBAN field. */
export default function BankAccountFormModal({
  open,
  mode,
  account,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("bankAccounts.form");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const ibanRef = useRef<HTMLInputElement>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { bankId: "", iban: "" },
  });
  const { ref: registerIbanRef, ...ibanField } = register("iban");
  const bankId = watch("bankId");
  const iban = watch("iban");

  useEffect(() => {
    if (!open) return;
    reset({ bankId: account?.bankId ?? "", iban: account?.iban ?? "" });
  }, [account, open, reset]);

  const title = t(`${mode}.title`);
  const submitLabel = t(`${mode}.submit`);
  // An edited account names its own bank, so it shows before the list loads.
  const accountBank: Bank | undefined = account && {
    id: account.bankId,
    name: account.bankName,
    logo: account.logo,
  };
  const unchanged =
    mode === "edit" &&
    account?.bankId === bankId &&
    account?.iban === normalizeIban(iban ?? "");
  const bankError = fieldError(errors.bankId?.message);
  const ibanError = fieldError(errors.iban?.message);
  const submitError = errors.root?.server?.message;
  const bankErrorId = "bank-form-bank-error";

  const submit = handleSubmit(async (values) => {
    if (loading) return;
    const error = await onConfirm(values);
    if (error && !applyFieldErrors(error, setError, ["bankId", "iban"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  });

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      placement="center"
      initialFocusRef={ibanRef}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
      label={title}
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <form onSubmit={submit} noValidate>
          <Controller
            control={control}
            name="bankId"
            render={({ field }) => (
              <div className="mb-5 flex flex-col gap-2">
                <span
                  className="text-text-primary text-sm leading-5 font-semibold"
                  id="bank_form_bank_label"
                >
                  {t("bankName")}
                </span>
                <BankSelect
                  value={field.value}
                  onChange={field.onChange}
                  initialBank={accountBank}
                  labelId="bank_form_bank_label"
                  invalid={Boolean(bankError)}
                  errorId={bankError ? bankErrorId : undefined}
                />
                {bankError && (
                  <p id={bankErrorId} className="form_error" role="alert">
                    {bankError}
                  </p>
                )}
              </div>
            )}
          />

          <div className="mb-5 flex flex-col gap-2">
            <FormInput
              {...ibanField}
              ref={(element) => {
                registerIbanRef(element);
                ibanRef.current = element;
              }}
              id="bank_form_iban"
              className="border-stroke-light bg-surface-on-background text-text-primary placeholder:text-text-placeholder focus:border-action-primary h-12.5 w-full rounded-md border px-3 py-0 text-sm transition-colors outline-none placeholder:text-xs focus:ring-0"
              label={t("iban")}
              type="text"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              placeholder="SA0000000000000000000000"
              required
              error={ibanError}
            />
          </div>

          {submitError && (
            <p className="text-status-error mt-2 mb-0 text-sm" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={unchanged}
            loading={loading}
            size="lg"
          >
            {submitLabel}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
