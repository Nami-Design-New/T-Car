"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ICONS } from "@/shared/config/assets";
import { toAppError, type AppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import { useNotify } from "@/shared/hooks/useNotify";
import { useRouter } from "@/i18n/navigation";
import { uploadLicenseAction } from "../actions";
import type { ProfileFlowProps } from "./ProfileFlowProps";

interface Props extends ProfileFlowProps {
  initialLicenseUploaded: boolean;
  initialLicenseUrl?: string;
}
const checkMark = ICONS.checkMark;
const arrowIcon = ICONS.arrowIcon;
const xIcon = ICONS.xIcon;
const LicenseModal = dynamic(() => import("./LicenseModal"), { ssr: false });

export default function LicenseSection({
  initialLicenseUploaded,
  initialLicenseUrl,
  pendingAction,
  setPendingAction,
}: Props) {
  const t = useTranslations("account.profile");
  const notify = useNotify();
  const router = useRouter();
  const [licenseUploaded, setLicenseUploaded] = useState(
    initialLicenseUploaded,
  );
  const [licenseUrl, setLicenseUrl] = useState(initialLicenseUrl);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const handleLicenseSubmit = async (
    file: File,
  ): Promise<AppError | undefined> => {
    setPendingAction("license");
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
      setLicenseUploaded(true);
      setLicenseUrl(result.data);
      notify.success(result.message);
      router.refresh();
      setShowLicenseModal(false);
    } catch (error) {
      return toAppError(error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      {/* ==================== License ==================== */}
      {licenseUploaded ? (
        <div
          className="bg-surface-on-background w-full rounded-sm transition-colors"
          role="status"
        >
          {" "}
          <button
            type="button"
            className="flex min-h-14.5 w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2 text-start transition-opacity hover:opacity-85 max-md:px-2.5"
            onClick={() => setShowLicenseModal(true)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="text-text-primary text-sm leading-[1.4] font-semibold max-md:text-xs">
                {t("license")}
              </span>
              <Image
                src={checkMark.src}
                width={checkMark.width}
                height={checkMark.height}
                alt="check icon"
              />
            </div>{" "}
            <Image
              src={arrowIcon.src}
              width={arrowIcon.width}
              height={arrowIcon.height}
              alt="arrow icon"
              className="size-5 shrink-0 ltr:scale-x-[-1]"
            />
          </button>
        </div>
      ) : (
        <div className="bg-status-error-background w-full rounded-sm transition-colors">
          <button
            type="button"
            className="flex min-h-14.5 w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2 text-start transition-opacity hover:opacity-85 max-md:px-2.5"
            onClick={() => setShowLicenseModal(true)}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-text-primary text-[13px] leading-[1.4] font-semibold max-md:text-xs">
                {t("license")}
              </span>

              <div className="text-text-subtle flex min-w-0 items-center gap-1.5 text-xs">
                <span className="min-w-0 wrap-anywhere">
                  {t("licenseRequired")}
                </span>
                <Image
                  src={xIcon.src}
                  width={xIcon.width}
                  height={xIcon.height}
                  alt="x icon"
                  className="size-3.5 shrink-0"
                />
              </div>
            </div>

            <Image
              src={arrowIcon.src}
              width={arrowIcon.width}
              height={arrowIcon.height}
              alt="arrow icon"
              className="size-5 shrink-0 ltr:scale-x-[-1]"
            />
          </button>
        </div>
      )}
      <LicenseModal
        open={showLicenseModal}
        onClose={() => {
          if (pendingAction !== "license") setShowLicenseModal(false);
        }}
        onSubmit={handleLicenseSubmit}
        licenseUrl={licenseUrl}
        loading={pendingAction === "license"}
      />
    </>
  );
}
