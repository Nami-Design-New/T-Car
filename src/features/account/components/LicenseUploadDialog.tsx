"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toAppError, type AppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import { useNotify } from "@/shared/hooks/useNotify";
import { uploadLicenseAction } from "../actions";
import LicenseModal from "./LicenseModal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the stored license URL after a successful upload. */
  onUploaded: (licenseUrl: string) => void;
}

/** The license upload dialog with its own upload action, for flows outside the profile (booking). */
export default function LicenseUploadDialog({
  open,
  onClose,
  onUploaded,
}: Props) {
  const t = useTranslations("account.license");
  const notify = useNotify();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (file: File): Promise<AppError | undefined> => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("license", file);
      const result = fromActionResult(await uploadLicenseAction(formData));
      if (!result.ok) {
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        }
        return result.error;
      }
      notify.success(result.message);
      onUploaded(result.data);
    } catch (error) {
      return toAppError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LicenseModal
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      onSubmit={handleSubmit}
      loading={loading}
      description={t("requiredToBook")}
    />
  );
}
