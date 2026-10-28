"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiUploadCloud } from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { AppError } from "@/shared/lib/errors";
import { applyFieldErrors } from "@/shared/lib/validation";
import { licenseUploadSchema, type LicenseUploadValues } from "../validation";
interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<AppError | undefined>;
  loading?: boolean;
}

export default function LicenseModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const t = useTranslations("account.license");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LicenseUploadValues>({
    resolver: zodResolver(licenseUploadSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const file = watch("file");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      reset();
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setValue("file", selectedFile, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit(async ({ file: selectedFile }) => {
    if (loading) return;
    const error = await onSubmit(selectedFile as File);
    if (error && !applyFieldErrors(error, setError, ["file"])) {
      setError("root.server", {
        type: error.kind,
        message: errorMessage(error),
      });
    }
  });

  const uploadError =
    fieldError(errors.file?.message) ?? errors.root?.server?.message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-[420px] rounded-lg bg-surface-elevated max-[480px]:w-[calc(100%-30px)] max-[480px]:max-w-[350px]"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="flex flex-col max-[480px]:p-2.5">
        <form onSubmit={submit} noValidate>
          <button
            type="button"
            className={cn(
              "flex min-h-[100px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-stroke-heavy bg-surface-elevated p-[15px] text-text-placeholder transition-colors hover:border-action-primary hover:bg-surface-on-background max-[480px]:min-h-[85px]",
              file && "border-action-primary text-action-primary",
            )}
            onClick={() => inputRef.current?.click()}
          >
            <FiUploadCloud className="size-[22px] stroke-[1.4]" />

            {file ? (
              <span className="max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
                {file.name}
              </span>
            ) : (
              <>
                <span className="text-xs max-[480px]:text-[8px]">
                  {t("uploadPrompt")}
                </span>

                <small className="text-[10px] text-text-placeholder max-[480px]:text-[7px]">
                  {t("fileTypes")}
                </small>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            aria-invalid={Boolean(errors.file)}
            aria-describedby={uploadError ? "license-file-error" : undefined}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            hidden
            onChange={handleFileChange}
          />

          <Button
            type="submit"
            className="mt-3 h-[38px] w-full text-xs max-[480px]:h-[34px] max-[480px]:text-[9px]"
            disabled={!file || loading}
            aria-busy={loading}
          >
            {t("submit")}
          </Button>

          {uploadError && (
            <p
              id="license-file-error"
              className="text-status-error text-sm mt-2 mb-0"
              role="alert"
            >
              {uploadError}
            </p>
          )}
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
