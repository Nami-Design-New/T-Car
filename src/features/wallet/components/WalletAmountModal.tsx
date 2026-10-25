"use client";

import { useRef } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ICONS } from "@/shared/config/assets";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { formatAmount } from "@/shared/lib/format";
import { applyFieldErrors } from "@/shared/lib/validation";
import { Button } from "@/shared/ui/Button";
import { FormInput } from "@/shared/ui/Form";
import { Dialog } from "@/shared/ui/Dialog";
import {
  amountFormSchema,
  amountSchema,
  type WalletAmountValues,
} from "../validation";
const sarIcon = ICONS.riyal;

interface Props {
  open: boolean;
  title: string;
  submitLabel: string;
  min: number;
  max?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<AppError | undefined>;
}

/** Amount entry sheet shared by wallet top-up and withdrawal. */
export default function WalletAmountModal({
  open,
  title,
  submitLabel,
  min,
  max,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("wallet.amount");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const inputRef = useRef<HTMLInputElement>(null);
  const schema = amountSchema(min, max);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<WalletAmountValues>({
    resolver: zodResolver(amountFormSchema(min, max)),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { ref: registerRef, ...amountField } = register("amount", {
    setValueAs: (value) => (value === "" ? undefined : Number(value)),
  });
  const amount = watch("amount");
  const valid = schema.safeParse(amount).success;
  const hintId = "wallet-amount-hint";
  const amountError = fieldError(errors.amount?.message);
  const submitError = errors.root?.server?.message;

  const onSubmit = handleSubmit(async ({ amount }) => {
    if (loading) return;
    try {
      const error = await onConfirm(amount);
      if (error && !applyFieldErrors(error, setError, ["amount"])) {
        setError("root.server", {
          type: error.kind,
          message: errorMessage(error),
        });
      }
    } catch (error) {
      setError("root.server", { type: "server", message: errorMessage(error) });
    }
  });

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      placement="center"
      initialFocusRef={inputRef}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body>
        <form onSubmit={onSubmit} noValidate>
          <div className=" [&_.form_group]:m-0 [&_.form_label]:sr-only [&_.form_input_wrapper]:flex [&_.form_input_wrapper]:h-11.5 [&_.form_input_wrapper]:items-center [&_.form_input_wrapper]:rounded-sm [&_.form_input_wrapper]:border [&_.form_input_wrapper]:border-stroke-light [&_.form_input_wrapper]:px-2.5 [&_.form_input_wrapper]:text-text-subtle [&_.form_input_icon]:static! [&_.form_input_icon]:order-first [&_.form_input_icon]:translate-y-0! [&_.form_input_icon]:text-action-primary [&_.form_error]:mt-1">
            <FormInput
              {...amountField}
              ref={(element) => {
                registerRef(element);
                inputRef.current = element;
              }}
              id="wallet-amount"
              label={title}
              type="number"
              min={min}
              max={max}
              inputMode="decimal"
              placeholder="00"
              aria-describedby={hintId}
              required
              error={amountError}
              // className={` h-full min-w-0 flex-1 border-0 bg-transparent px-2 py-0 text-end text-sm text-text-primary outline-none placeholder:text-text-placeholder focus:border-0 focus:ring-0 ${amountError ? "border-status-error" : "border-stroke-light"}`}
              icon={
                <Image
                  src={sarIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="currency_icon block object-contain opacity-70"
                />
              }
            />
          </div>
          <small
            id={hintId}
            className={` my-2 block px-1 text-right text-sm text-text-placeholder ${amountError ? "invalid text-status-error" : "mb-3"}`}
          >
            {max === undefined
              ? t("rangeMin", { min: formatAmount(min) })
              : t("rangeWithMax", {
                  min: formatAmount(min),
                  max: formatAmount(max),
                })}
          </small>
          {submitError && (
            <p className="text-status-error text-sm mt-2 mb-0" role="alert">
              {submitError}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!valid}
            loading={loading}
          >
            {submitLabel}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
