"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { PiBank } from "react-icons/pi";
import { ICONS } from "@/shared/config/assets";
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

const arrowDownIcon = ICONS.arrowDown;

interface Props {
  open: boolean;
  mode: "add" | "edit";
  banks: Bank[];
  /** The account being edited; its values pre-fill the form. */
  account?: BankAccount;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: BankAccountPayload) => Promise<AppError | undefined>;
}

function BankLogo({ bank }: { bank: Bank }) {
  return bank.logo ? (
    <Image
      src={bank.logo}
      alt=""
      width={45}
      height={20}
      className="bank_form_logo"
    />
  ) : (
    <PiBank className="bank_form_logo_fallback" aria-hidden="true" />
  );
}

/** Add / edit bank account sheet: bank picker plus IBAN field. */
export default function BankAccountFormModal({
  open,
  mode,
  banks,
  account,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("bankAccounts.form");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const ibanRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
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
    setPickerOpen(false);
  }, [account, open, reset]);

  const title = t(`${mode}.title`);
  const submitLabel = t(`${mode}.submit`);
  const selectedBank = banks.find((bank) => bank.id === bankId);
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
      placement="bottom-sheet"
      initialFocusRef={ibanRef}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
      label={title}
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <form onSubmit={submit} noValidate>
        <Controller
          control={control}
          name="bankId"
          render={({ field }) => (
            <div className="bank_form_field">
              <span className="bank_form_label" id="bank_form_bank_label">
                {t("bankName")}
              </span>
              <div className="bank_form_picker">
                <button
                  type="button"
                  role="combobox"
                  className={`bank_form_control ${pickerOpen ? "open" : ""}`}
                  aria-haspopup="listbox"
                  aria-controls="bank_form_bank_options"
                  aria-expanded={pickerOpen}
                  aria-labelledby="bank_form_bank_label"
                  aria-required="true"
                  aria-invalid={Boolean(bankError)}
                  aria-describedby={bankError ? bankErrorId : undefined}
                  onClick={() => setPickerOpen((value) => !value)}
                >
                  {selectedBank ? (
                    <span className="bank_form_value">
                      <BankLogo bank={selectedBank} />
                      {selectedBank.name}
                    </span>
                  ) : (
                    <span className="bank_form_placeholder">
                      {t("chooseBank")}
                    </span>
                  )}
                  <Image
                    src={arrowDownIcon}
                    alt=""
                    width={18}
                    height={18}
                    className="bank_form_arrow"
                  />
                </button>

                {pickerOpen && (
                  <ul
                    id="bank_form_bank_options"
                    className="bank_form_options"
                    role="listbox"
                    aria-labelledby="bank_form_bank_label"
                  >
                    {banks.map((bank) => (
                      <li
                        key={bank.id}
                        role="option"
                        aria-selected={bank.id === field.value}
                      >
                        <button
                          type="button"
                          className={`bank_form_option ${bank.id === field.value ? "selected" : ""}`}
                          onClick={() => {
                            field.onChange(bank.id);
                            setPickerOpen(false);
                          }}
                        >
                          <BankLogo bank={bank} />
                          {bank.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {bankError && (
                <p id={bankErrorId} className="form_error" role="alert">
                  {bankError}
                </p>
              )}
            </div>
          )}
        />

        <div className="bank_form_field">
          <FormInput
            {...ibanField}
            ref={(element) => {
              registerIbanRef(element);
              ibanRef.current = element;
            }}
            id="bank_form_iban"
            className="bank_form_control bank_form_input"
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
          <p className="text-status-error text-sm mt-2 mb-0" role="alert">
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
    </Dialog>
  );
}
