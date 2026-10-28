"use client";

import { Dialog } from "@/shared/ui/Dialog";
import type { AppError } from "@/shared/lib/errors";
import PhoneChangeForm from "./PhoneChangeForm";
import PhoneVerificationForm from "./PhoneVerificationForm";
import { useTranslations } from "next-intl";
import { BackButton } from "@/shared/ui/BackButton";

interface Props {
  open: boolean;
  onClose: () => void;
  currentPhone?: string;
  pendingPhone?: string;
  step?: "edit" | "verify" | null;
  onStepChange?: (step: "edit" | "verify" | null) => void;
  onSendCode: (phone: string) => Promise<AppError | undefined>;
  onResendCode: (phone: string) => Promise<AppError | undefined>;
  onVerifyCode: (code: string) => Promise<AppError | undefined>;
  onVerified?: (phone: string) => void;
  loading?: boolean;
}

export default function PhoneChangeModal({
  open,
  onClose,
  currentPhone = "",
  pendingPhone = "",
  step = null,
  onStepChange,
  onSendCode,
  onResendCode,
  onVerifyCode,
  onVerified,
  loading = false,
}: Props) {
  const t = useTranslations("account");

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
      size="md"
    >
      <Dialog.Header>
        <Dialog.Title>
          {step === "edit" ? (
            t("editPhone.title")
          ) : (
            <div className="flex items-center gap-2">
              <BackButton
                type="button"
                onClick={() => onStepChange?.("edit")}
                aria-label={t("verifyPhone.editPhone")}
              />
              {t("verifyPhone.title")}
            </div>
          )}
        </Dialog.Title>
        <Dialog.Close className="ms-auto" />
      </Dialog.Header>
      <Dialog.Body>
        {step === "verify" ? (
          <PhoneVerificationForm
            phone={pendingPhone}
            onResendCode={onResendCode}
            onVerifyCode={onVerifyCode}
            onEditPhone={() => onStepChange?.("edit")}
            onVerified={(phone) => {
              onStepChange?.(null);
              onVerified?.(phone);
            }}
            loading={loading}
          />
        ) : (
          <PhoneChangeForm
            currentPhone={currentPhone}
            onSendCode={onSendCode}
            loading={loading}
          />
        )}
      </Dialog.Body>
    </Dialog>
  );
}
