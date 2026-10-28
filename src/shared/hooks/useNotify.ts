"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** A backend message that is an untranslated key, e.g. `validation.email_required`. */
const MESSAGE_KEY = /^[a-z_]+(\.[a-z_]+)+$/;

function isShowable(message: string | undefined): message is string {
  const text = message?.trim() ?? "";
  return text !== "" && !MESSAGE_KEY.test(text);
}

/**
 * Shows API success and validation messages as toasts, with the backend's
 * (already localized) text. A missing or key-like message falls back to
 * `common.success` / `errors.validation`. Other errors stay on `useErrorMessage()`.
 */
export function useNotify() {
  const common = useTranslations("common");
  const errors = useTranslations("errors");

  return useMemo(
    () => ({
      success: (message?: string) =>
        toast.success(isShowable(message) ? message : common("success")),
      error: (message?: string) =>
        toast.error(isShowable(message) ? message : errors("validation")),
    }),
    [common, errors],
  );
}
