"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { ICONS } from "@/shared/config/assets";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { fromActionResult } from "@/shared/lib/result";
import { AlertDialog } from "@/shared/ui/AlertDialog";
import { deleteAccountAction } from "../actions";
import type { ProfileFlowProps } from "./ProfileFlowProps";

interface Props extends ProfileFlowProps {}
const xIcon = ICONS.xIcon;

export default function DeleteAccountSection({
  pendingAction,
  setPendingAction,
}: Props) {
  const t = useTranslations("account.profile");
  const errorMessage = useErrorMessage();
  const notify = useNotify();
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    setPendingAction("delete");
    setDeleteError(null);
    try {
      const result = fromActionResult(await deleteAccountAction());
      if (!result.ok) {
        const message =
          result.error.kind === "validation" && result.error.serverMessage
            ? result.error.serverMessage
            : errorMessage(result.error);
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        }
        setDeleteError(message);
        return;
      }
      // The action also ended the session; leave the protected page.
      setShowDeleteModal(false);
      notify.success(result.message);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      {/* ==================== Delete Account ==================== */}
      <button
        type="button"
        className="text-status-error mb-2 flex w-full items-center justify-start gap-1.5 border-0 bg-transparent px-0 py-1 text-end text-sm font-semibold transition-opacity hover:opacity-80 max-md:text-xs [&>svg]:text-[17px] max-md:[&>svg]:text-[15px]"
        onClick={() => {
          setDeleteError(null);
          setShowDeleteModal(true);
        }}
      >
        <Image
          src={xIcon.src}
          width={xIcon.width}
          height={xIcon.height}
          alt="x icon"
          className="size-3.5 shrink-0"
        />
        <span>{t("deleteAccount")}</span>
      </button>
      <AlertDialog
        open={showDeleteModal}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        primaryButtonText={t("deleteAccount")}
        secondaryButtonText={t("keepAccount")}
        showButtons
        error={deleteError ?? undefined}
        loading={pendingAction === "delete"}
        onPrimary={handleDeleteAccount}
        onSecondary={() => {
          if (pendingAction !== "delete") setShowDeleteModal(false);
        }}
      />
    </>
  );
}
