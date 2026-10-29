"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiEdit2, FiUploadCloud } from "react-icons/fi";
import Image from "next/image";
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
  licenseUrl?: string;
  loading?: boolean;
}

export default function LicenseModal({
  open,
  onClose,
  onSubmit,
  licenseUrl,
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
  const [previewUrl, setPreviewUrl] = useState<string>();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageUrl = previewUrl ?? licenseUrl;

  useEffect(() => {
    if (!open) {
      reset();
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open, reset]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file as File);
    return () => reader.abort();
  }, [file]);

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
      size="md"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="flex flex-col max-[480px]:p-2.5">
        <form onSubmit={submit} noValidate>
          {imageUrl ? (
            <div className="justify flex flex-col">
              <div className="border-stroke-light relative rounded-lg border">
                <Image
                  src={imageUrl}
                  alt={t("title")}
                  width={388}
                  height={220}
                  unoptimized
                  className="w-full object-contain"
                />
                <button
                  type="button"
                  aria-label={t("editImage")}
                  className="bg-surface-elevated text-text-primary absolute inset-e-2 bottom-2 grid size-9 place-items-center rounded-md border-0 shadow-sm transition-opacity hover:opacity-85"
                  onClick={() => inputRef.current?.click()}
                >
                  <FiEdit2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <p className="text-text-placeholder mt-2 mb-3 text-xs">
                {t("fileTypes")}
              </p>
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                "border-stroke-heavy bg-surface-elevated text-text-placeholder hover:border-action-primary hover:bg-surface-on-background flex min-h-[100px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed p-[15px] transition-colors max-[480px]:min-h-[85px]",
                file && "border-action-primary text-action-primary",
              )}
              onClick={() => inputRef.current?.click()}
            >
              <FiUploadCloud className="size-5.5 stroke-[1.4]" />

              {file ? (
                <span className="text-text-primary max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap">
                  {file.name}
                </span>
              ) : (
                <>
                  <span className="text-xs max-[480px]:text-[8px]">
                    {t("uploadPrompt")}
                  </span>

                  <small className="text-text-placeholder text-[10px] max-[480px]:text-[7px]">
                    {t("fileTypes")}
                  </small>
                </>
              )}
            </button>
          )}

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
            loading={loading}
          >
            {t("submit")}
          </Button>

          {uploadError && (
            <p
              id="license-file-error"
              className="text-status-error mt-2 mb-0 text-sm"
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
