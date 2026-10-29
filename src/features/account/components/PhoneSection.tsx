"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ICONS } from "@/shared/config/assets";
import { AppError, toAppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import { useNotify } from "@/shared/hooks/useNotify";
import { useRouter } from "@/i18n/navigation";
import { sendPhoneCodeAction, verifyPhoneAction } from "../actions";
import PhoneChangeModal from "./PhoneChangeModal";
import type { PendingAction, ProfileFlowProps } from "./ProfileFlowProps";

interface Props extends ProfileFlowProps {
  initialPhone: string;
}

type PhoneStep = "edit" | "verify" | null;
const checkMark = ICONS.checkMark;
const arrowIcon = ICONS.arrowIcon;

export default function PhoneSection({
  initialPhone,
  pendingAction,
  setPendingAction,
}: Props) {
  const t = useTranslations("account.profile");
  const notify = useNotify();
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [phoneStep, setPhoneStep] = useState<PhoneStep>(null);
  const [pendingPhone, setPendingPhone] = useState<PhoneFieldValue | null>(
    null,
  );
  /** The phone actions resolve with their error; the dialogs show it next to the input. */
  const runPhoneAction = async (
    action: Exclude<PendingAction, null>,
    write: () => Promise<AppError | undefined>,
  ) => {
    setPendingAction(action);
    try {
      return await write();
    } catch (error) {
      return toAppError(error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSendCode = (phone: PhoneFieldValue) => {
    return runPhoneAction("send", async () => {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) {
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        }
        return result.error;
      }
      notify.success(result.message);
      setPendingPhone(result.data);
      setPhoneStep("verify");
    });
  };

  // ==================== Resend OTP ====================

  const handleResendCode = (phone: PhoneFieldValue) =>
    runPhoneAction("resend", async () => {
      const result = fromActionResult(await sendPhoneCodeAction(phone));
      if (!result.ok) {
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        }
        return result.error;
      }
      notify.success(result.message);
    });

  // ==================== Verify Phone ====================

  const handleVerifyCode = (code: string) => {
    return runPhoneAction("verify", async () => {
      if (!pendingPhone) {
        return new AppError("validation", "account.invalidPhone");
      }
      const result = fromActionResult(
        await verifyPhoneAction(pendingPhone, code),
      );
      if (!result.ok) {
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        }
        return result.error;
      }
      setPhone(result.data);
      notify.success(result.message);
      router.refresh();
    });
  };

  const handleVerified = () => {
    setPhoneStep(null);
    setPendingPhone(null);
  };

  return (
    <>
      {/* ==================== Phone ==================== */}
      <button
        type="button"
        className="bg-surface-on-background flex min-h-14.5 w-full items-center justify-between gap-3 rounded-sm border-0 px-3 py-2 text-start transition-colors hover:opacity-85 max-md:px-2.5"
        onClick={() => setPhoneStep("edit")}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-text-primary text-[13px] leading-[1.4] font-semibold max-md:text-xs">
            {t("phone")}
          </span>

          <div className="text-text-subtle [&>svg]:text-status-success flex min-w-0 items-center gap-1.5 text-[11px] leading-[1.5] max-md:text-[10px] [&>svg]:shrink-0 [&>svg]:text-sm">
            <span className="min-w-0 wrap-anywhere" dir="ltr">
              {phone}
            </span>
            <Image
              src={checkMark.src}
              width={checkMark.width}
              height={checkMark.height}
              alt="check icon"
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
      <PhoneChangeModal
        open={phoneStep !== null}
        onClose={() => {
          if (
            pendingAction === "send" ||
            pendingAction === "resend" ||
            pendingAction === "verify"
          )
            return;
          setPhoneStep(null);
        }}
        currentPhone={phone}
        pendingPhone={pendingPhone}
        step={phoneStep}
        onStepChange={(step) => {
          if (step === "edit" && pendingAction === "resend") return;
          setPhoneStep(step);
        }}
        onSendCode={handleSendCode}
        onResendCode={handleResendCode}
        onVerifyCode={handleVerifyCode}
        onVerified={handleVerified}
        loading={
          pendingAction === "send" ||
          pendingAction === "resend" ||
          pendingAction === "verify"
        }
      />
    </>
  );
}
