"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiUploadCloud } from "react-icons/fi";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";

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
      className="selection_modal license_modal"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="modal_body">
        <form onSubmit={submit} noValidate>
          <button
            type="button"
            className={`license_upload_area ${file ? "has_file" : ""}`}
            onClick={() => inputRef.current?.click()}
          >
            <FiUploadCloud />

            {file ? (
              <span className="file_name">{file.name}</span>
            ) : (
              <>
                <span>{t("uploadPrompt")}</span>

                <small>{t("fileTypes")}</small>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            aria-invalid={Boolean(errors.file)}
            aria-describedby={uploadError ? "license-file-error" : undefined}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleFileChange}
          />

          <Button
            type="submit"
            className="mt-2"

            disabled={!file || loading}
            aria-busy={loading}
          >
            {t("submit")}
          </Button>

          {uploadError && (
            <p
              id="license-file-error"
              className="text-danger small mt-2 mb-0"
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
